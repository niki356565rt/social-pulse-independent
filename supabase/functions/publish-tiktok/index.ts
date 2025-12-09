import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TikTokUploadResponse {
  data: {
    publish_id: string;
    upload_url?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { postId } = await req.json();

    // If postId is provided, publish that specific post
    // Otherwise, check for scheduled posts that are due
    let postsToPublish: any[] = [];

    if (postId) {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*, connected_accounts!inner(*)')
        .eq('id', postId)
        .eq('platform', 'tiktok')
        .single();

      if (error || !data) {
        console.error('Post not found:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Post not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      postsToPublish = [data];
    } else {
      // Get all scheduled TikTok posts that are due
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*, connected_accounts!inner(*)')
        .eq('platform', 'tiktok')
        .eq('status', 'scheduled')
        .lte('scheduled_for', now);

      if (error) {
        console.error('Error fetching scheduled posts:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch posts' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      postsToPublish = data || [];
    }

    console.log(`Found ${postsToPublish.length} TikTok posts to publish`);

    const results = [];

    for (const post of postsToPublish) {
      console.log(`Publishing TikTok post ${post.id}`);

      // Update status to publishing
      await supabase
        .from('scheduled_posts')
        .update({ status: 'publishing', updated_at: new Date().toISOString() })
        .eq('id', post.id);

      try {
        const accessToken = post.connected_accounts.access_token;
        const mediaUrl = post.media_urls[0]; // TikTok only supports one video at a time

        // TikTok Content Posting API
        // Step 1: Initialize video upload
        const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify({
            post_info: {
              title: post.content || '',
              privacy_level: 'SELF_ONLY', // Start with private, user can change on TikTok
              disable_duet: false,
              disable_comment: false,
              disable_stitch: false,
            },
            source_info: {
              source: 'PULL_FROM_URL',
              video_url: mediaUrl,
            },
          }),
        });

        const initData: TikTokUploadResponse = await initResponse.json();
        console.log('TikTok init response:', JSON.stringify(initData));

        if (initData.error) {
          throw new Error(initData.error.message || 'TikTok API error');
        }

        // Success - TikTok will process the video
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'published',
            platform_post_id: initData.data.publish_id,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        results.push({ postId: post.id, success: true, publishId: initData.data.publish_id });

      } catch (error: any) {
        console.error(`Error publishing post ${post.id}:`, error);

        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        results.push({ postId: post.id, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        publishedCount: results.filter(r => r.success).length,
        failedCount: results.filter(r => !r.success).length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
