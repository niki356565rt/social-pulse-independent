import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY")!;

interface SocialMetrics {
  followers_count: number;
  following_count?: number;
  posts_count?: number;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  engagement_rate?: number;
}

interface PostData {
  platform_post_id: string;
  content: string | null;
  media_url: string | null;
  posted_at: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  shares_count: number;
  engagement_rate: number | null;
}

// Instagram: Fetch metrics and posts
async function fetchInstagramMetrics(accessToken: string, platformUserId: string): Promise<{ metrics: SocialMetrics; posts: PostData[] }> {
  console.log("Fetching Instagram metrics for:", platformUserId);
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${platformUserId}?fields=followers_count,follows_count,media_count&access_token=${accessToken}`
  );
  const data = await response.json();
  console.log("Instagram metrics response:", JSON.stringify(data));

  if (data.error) {
    throw new Error(data.error.message);
  }

  // Get recent media with full details
  const mediaRes = await fetch(
    `https://graph.facebook.com/v18.0/${platformUserId}/media?fields=id,caption,media_url,thumbnail_url,timestamp,like_count,comments_count,media_type&limit=25&access_token=${accessToken}`
  );
  const mediaData = await mediaRes.json();
  
  let totalLikes = 0;
  let totalComments = 0;
  const rawPosts = mediaData.data || [];
  const posts: PostData[] = [];
  
  rawPosts.forEach((post: any) => {
    const likes = post.like_count || 0;
    const comments = post.comments_count || 0;
    totalLikes += likes;
    totalComments += comments;

    // Calculate engagement rate for this post
    const postEngagement = data.followers_count > 0 
      ? ((likes + comments) / data.followers_count) * 100 
      : 0;

    posts.push({
      platform_post_id: post.id,
      content: post.caption || null,
      media_url: post.media_url || post.thumbnail_url || null,
      posted_at: post.timestamp || null,
      likes_count: likes,
      comments_count: comments,
      views_count: 0,
      shares_count: 0,
      engagement_rate: Math.round(postEngagement * 100) / 100,
    });
  });

  const engagementRate = data.followers_count > 0 && rawPosts.length > 0
    ? ((totalLikes + totalComments) / rawPosts.length / data.followers_count) * 100
    : 0;

  return {
    metrics: {
      followers_count: data.followers_count || 0,
      following_count: data.follows_count || 0,
      posts_count: data.media_count || 0,
      likes_count: totalLikes,
      comments_count: totalComments,
      engagement_rate: Math.round(engagementRate * 100) / 100,
    },
    posts,
  };
}

// TikTok: Fetch metrics and posts
async function fetchTikTokMetrics(accessToken: string): Promise<{ metrics: SocialMetrics; posts: PostData[] }> {
  console.log("Fetching TikTok metrics");
  
  // Fetch user info
  const userResponse = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const userData = await userResponse.json();
  console.log("TikTok user response:", JSON.stringify(userData));

  const user = userData.data?.user || {};

  // Fetch recent videos
  const posts: PostData[] = [];
  try {
    const videosResponse = await fetch(
      "https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,create_time,like_count,comment_count,view_count,share_count",
      {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ max_count: 20 }),
      }
    );
    const videosData = await videosResponse.json();
    console.log("TikTok videos response:", JSON.stringify(videosData));

    const videos = videosData.data?.videos || [];
    videos.forEach((video: any) => {
      const likes = video.like_count || 0;
      const comments = video.comment_count || 0;
      const views = video.view_count || 0;
      
      // TikTok engagement rate based on views
      const postEngagement = views > 0 
        ? ((likes + comments) / views) * 100 
        : 0;

      posts.push({
        platform_post_id: video.id,
        content: video.title || null,
        media_url: video.cover_image_url || null,
        posted_at: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
        likes_count: likes,
        comments_count: comments,
        views_count: views,
        shares_count: video.share_count || 0,
        engagement_rate: Math.round(postEngagement * 100) / 100,
      });
    });
  } catch (videoError) {
    console.error("Error fetching TikTok videos:", videoError);
  }

  return {
    metrics: {
      followers_count: user.follower_count || 0,
      following_count: user.following_count || 0,
      posts_count: user.video_count || 0,
      likes_count: user.likes_count || 0,
    },
    posts,
  };
}

// YouTube: Fetch metrics and posts
async function fetchYouTubeMetrics(channelId: string, accessToken?: string): Promise<{ metrics: SocialMetrics; posts: PostData[] }> {
  console.log("Fetching YouTube metrics for:", channelId);
  
  // Use access token if available, fallback to API key
  const authParam = accessToken 
    ? `access_token=${accessToken}` 
    : `key=${YOUTUBE_API_KEY}`;
  
  // Fetch channel stats
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&id=${channelId}&${authParam}`;
  const channelResponse = await fetch(channelUrl);
  const channelData = await channelResponse.json();
  console.log("YouTube channel response:", JSON.stringify(channelData));

  if (channelData.error) {
    throw new Error(channelData.error.message);
  }

  const stats = channelData.items?.[0]?.statistics || {};
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  const posts: PostData[] = [];

  // Fetch recent videos from uploads playlist
  if (uploadsPlaylistId) {
    try {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=20&${authParam}`;
      const playlistResponse = await fetch(playlistUrl);
      const playlistData = await playlistResponse.json();
      console.log("YouTube playlist response:", JSON.stringify(playlistData));

      const videoIds = (playlistData.items || []).map((item: any) => item.contentDetails?.videoId).filter(Boolean);

      if (videoIds.length > 0) {
        // Fetch video statistics
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(",")}&${authParam}`;
        const videosResponse = await fetch(videosUrl);
        const videosData = await videosResponse.json();
        console.log("YouTube videos response:", JSON.stringify(videosData));

        const subscriberCount = parseInt(stats.subscriberCount) || 0;

        (videosData.items || []).forEach((video: any) => {
          const likes = parseInt(video.statistics?.likeCount) || 0;
          const comments = parseInt(video.statistics?.commentCount) || 0;
          const views = parseInt(video.statistics?.viewCount) || 0;

          // YouTube engagement rate based on views
          const postEngagement = views > 0 
            ? ((likes + comments) / views) * 100 
            : 0;

          posts.push({
            platform_post_id: video.id,
            content: video.snippet?.title || null,
            media_url: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url || null,
            posted_at: video.snippet?.publishedAt || null,
            likes_count: likes,
            comments_count: comments,
            views_count: views,
            shares_count: 0,
            engagement_rate: Math.round(postEngagement * 100) / 100,
          });
        });
      }
    } catch (videoError) {
      console.error("Error fetching YouTube videos:", videoError);
    }
  }

  return {
    metrics: {
      followers_count: parseInt(stats.subscriberCount) || 0,
      posts_count: parseInt(stats.videoCount) || 0,
      views_count: parseInt(stats.viewCount) || 0,
    },
    posts,
  };
}

// Save posts to database
async function savePosts(supabase: any, accountId: string, posts: PostData[]) {
  if (posts.length === 0) return;

  console.log(`Saving ${posts.length} posts for account ${accountId}`);

  for (const post of posts) {
    try {
      // Upsert to handle duplicates
      const { error } = await supabase
        .from("posts")
        .upsert({
          account_id: accountId,
          ...post,
        }, {
          onConflict: "account_id,platform_post_id",
        });

      if (error) {
        console.error(`Error saving post ${post.platform_post_id}:`, error);
      }
    } catch (err) {
      console.error(`Exception saving post ${post.platform_post_id}:`, err);
    }
  }
}

// Authenticate user from JWT token
async function authenticateUser(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No valid authorization header found");
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  
  // Create a client with the user's token to validate it
  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  
  if (error || !user) {
    console.error("Auth error:", error?.message);
    return null;
  }

  console.log("Authenticated user:", user.id);
  return user.id;
}

// Verify account ownership
async function verifyAccountOwnership(supabase: any, accountId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("connected_accounts")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.log(`Account ${accountId} does not belong to user ${userId}`);
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountId, refreshAll } = await req.json();
    
    // Authenticate user from JWT token
    const authenticatedUserId = await authenticateUser(req);
    
    if (!authenticatedUserId) {
      console.error("Unauthorized: No valid authentication token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Fetch metrics request - accountId: ${accountId}, userId: ${authenticatedUserId}, refreshAll: ${refreshAll}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get accounts to refresh
    let accounts;
    if (refreshAll) {
      // Only refresh accounts belonging to the authenticated user
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("user_id", authenticatedUserId);
      
      if (error) throw error;
      accounts = data;
    } else if (accountId) {
      // Verify the account belongs to the authenticated user
      const isOwner = await verifyAccountOwnership(supabase, accountId, authenticatedUserId);
      if (!isOwner) {
        return new Response(JSON.stringify({ error: "Forbidden: Account does not belong to user" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("id", accountId)
        .single();
      
      if (error) throw error;
      accounts = [data];
    } else {
      throw new Error("Either accountId or refreshAll is required");
    }

    const results = [];

    for (const account of accounts) {
      try {
        let metricsResult: { metrics: SocialMetrics; posts: PostData[] };

        switch (account.platform) {
          case "instagram":
            metricsResult = await fetchInstagramMetrics(account.access_token, account.platform_user_id);
            break;
          case "tiktok":
            metricsResult = await fetchTikTokMetrics(account.access_token);
            break;
          case "youtube":
            metricsResult = await fetchYouTubeMetrics(account.platform_user_id, account.access_token);
            break;
          default:
            console.log(`Unknown platform: ${account.platform}`);
            continue;
        }

        // Save metrics to database
        const { data: savedMetrics, error: saveError } = await supabase
          .from("social_metrics")
          .insert({
            account_id: account.id,
            ...metricsResult.metrics,
          })
          .select()
          .single();

        if (saveError) {
          console.error(`Error saving metrics for ${account.platform}:`, saveError);
        }

        // Save posts to database
        await savePosts(supabase, account.id, metricsResult.posts);

        results.push({
          accountId: account.id,
          platform: account.platform,
          success: true,
          metrics: savedMetrics || metricsResult.metrics,
          postsCount: metricsResult.posts.length,
        });
      } catch (accountError: any) {
        console.error(`Error fetching metrics for ${account.platform}:`, accountError);
        results.push({
          accountId: account.id,
          platform: account.platform,
          success: false,
          error: accountError.message,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Fetch metrics error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
