import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v18.0';

interface ScheduledPost {
  id: string;
  user_id: string;
  account_id: string;
  platform: string;
  content: string | null;
  media_urls: string[];
  media_type: string;
  scheduled_for: string;
  status: string;
}

interface ConnectedAccount {
  id: string;
  platform_user_id: string;
  access_token: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { scheduled } = await req.json().catch(() => ({ scheduled: false }));

    // If this is a scheduled call, process all pending posts
    if (scheduled) {
      console.log('Processing scheduled posts...');
      
      const now = new Date().toISOString();
      
      const { data: pendingPosts, error: fetchError } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('status', 'scheduled')
        .eq('platform', 'instagram')
        .lte('scheduled_for', now);

      if (fetchError) {
        console.error('Error fetching pending posts:', fetchError);
        throw fetchError;
      }

      console.log(`Found ${pendingPosts?.length || 0} pending posts`);

      const results = [];
      for (const post of pendingPosts || []) {
        const result = await publishPost(supabase, post);
        results.push(result);
      }

      return new Response(JSON.stringify({ processed: results.length, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Manual publish for a specific post
    const { postId } = await req.json();
    
    if (!postId) {
      throw new Error('Post ID is required');
    }

    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      throw new Error('Post not found');
    }

    const result = await publishPost(supabase, post);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in publish-instagram:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function publishPost(supabase: any, post: ScheduledPost) {
  console.log(`Publishing post ${post.id}...`);

  try {
    // Update status to publishing
    await supabase
      .from('scheduled_posts')
      .update({ status: 'publishing' })
      .eq('id', post.id);

    // Get the connected account
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', post.account_id)
      .single();

    if (accountError || !account) {
      throw new Error('Connected account not found');
    }

    const instagramUserId = account.platform_user_id;
    const accessToken = account.access_token;

    let containerResponse;
    let mediaContainerId;

    // Step 1: Create media container based on type
    if (post.media_type === 'image' || post.media_type === 'carousel') {
      if (post.media_urls.length === 1) {
        // Single image post
        containerResponse = await fetch(
          `${INSTAGRAM_GRAPH_API}/${instagramUserId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: post.media_urls[0],
              caption: post.content || '',
              access_token: accessToken,
            }),
          }
        );
      } else if (post.media_urls.length > 1) {
        // Carousel post - create individual containers first
        const childContainerIds = [];
        
        for (const mediaUrl of post.media_urls) {
          const childResponse = await fetch(
            `${INSTAGRAM_GRAPH_API}/${instagramUserId}/media`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image_url: mediaUrl,
                is_carousel_item: true,
                access_token: accessToken,
              }),
            }
          );
          
          const childData = await childResponse.json();
          if (childData.error) {
            throw new Error(`Carousel item error: ${childData.error.message}`);
          }
          childContainerIds.push(childData.id);
        }

        // Create carousel container
        containerResponse = await fetch(
          `${INSTAGRAM_GRAPH_API}/${instagramUserId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              media_type: 'CAROUSEL',
              children: childContainerIds.join(','),
              caption: post.content || '',
              access_token: accessToken,
            }),
          }
        );
      }
    } else if (post.media_type === 'video' || post.media_type === 'reels') {
      // Video/Reels post
      containerResponse = await fetch(
        `${INSTAGRAM_GRAPH_API}/${instagramUserId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_url: post.media_urls[0],
            caption: post.content || '',
            media_type: post.media_type === 'reels' ? 'REELS' : 'VIDEO',
            access_token: accessToken,
          }),
        }
      );
    }

    if (!containerResponse) {
      throw new Error('Failed to create media container');
    }

    const containerData = await containerResponse.json();
    
    if (containerData.error) {
      throw new Error(`Instagram API error: ${containerData.error.message}`);
    }

    mediaContainerId = containerData.id;
    console.log(`Media container created: ${mediaContainerId}`);

    // Step 2: Wait for video processing (if applicable)
    if (post.media_type === 'video' || post.media_type === 'reels') {
      let statusCheck = 0;
      let isReady = false;
      
      while (statusCheck < 30 && !isReady) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const statusResponse = await fetch(
          `${INSTAGRAM_GRAPH_API}/${mediaContainerId}?fields=status_code&access_token=${accessToken}`
        );
        const statusData = await statusResponse.json();
        
        if (statusData.status_code === 'FINISHED') {
          isReady = true;
        } else if (statusData.status_code === 'ERROR') {
          throw new Error('Video processing failed');
        }
        
        statusCheck++;
      }
      
      if (!isReady) {
        throw new Error('Video processing timeout');
      }
    }

    // Step 3: Publish the container
    const publishResponse = await fetch(
      `${INSTAGRAM_GRAPH_API}/${instagramUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: mediaContainerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();
    
    if (publishData.error) {
      throw new Error(`Publish error: ${publishData.error.message}`);
    }

    console.log(`Post published successfully: ${publishData.id}`);

    // Update post status to published
    await supabase
      .from('scheduled_posts')
      .update({
        status: 'published',
        platform_post_id: publishData.id,
        published_at: new Date().toISOString(),
      })
      .eq('id', post.id);

    return { success: true, postId: post.id, platformPostId: publishData.id };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error publishing post ${post.id}:`, error);

    // Update post status to failed
    await supabase
      .from('scheduled_posts')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', post.id);

    return { success: false, postId: post.id, error: errorMessage };
  }
}
