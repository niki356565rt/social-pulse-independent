import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INSTAGRAM_ACTOR = "apify/instagram-profile-scraper"; 
const TIKTOK_ACTOR = "clockworks/tiktok-profile-scraper";
const YOUTUBE_ACTOR = "streampot/youtube-scraper";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const APIFY_TOKEN = Deno.env.get("APIFY_API_TOKEN");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: competitors } = await supabase.from("competitors").select("*");

    // MOCK-MODUS: Wenn kein API Token vorhanden, gib Mock-Daten zurück
    if (!APIFY_TOKEN) {
      console.log("[Competitors] APIFY_API_TOKEN fehlt - verwende Mock-Daten");
      
      const mockResults = [];
      for (const competitor of competitors || []) {
        // Generiere realistische Mock-Daten
        const mockFollowers = Math.floor(Math.random() * 50000) + 1000;
        const mockPosts = Math.floor(Math.random() * 500) + 10;
        const mockEngagement = (Math.random() * 5 + 0.5).toFixed(2);
        
        await supabase.from("competitor_metrics").insert({
          competitor_id: competitor.id,
          followers_count: mockFollowers,
          following_count: Math.floor(mockFollowers * 0.3),
          posts_count: mockPosts,
          engagement_rate: parseFloat(mockEngagement),
        });
        
        mockResults.push({ 
          user: competitor.username, 
          status: "mock", 
          stats: { followers: mockFollowers, posts: mockPosts },
          note: "Mock-Daten (APIFY_API_TOKEN fehlt)"
        });
      }
      
      return new Response(JSON.stringify({ 
        results: mockResults,
        warning: "APIFY_API_TOKEN nicht konfiguriert - Mock-Daten wurden verwendet. Füge den Token in den Secrets hinzu für echte Daten."
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // LIVE-MODUS: Echte Apify-Abfragen
    const results = [];

    for (const competitor of competitors || []) {
      try {
        let runUrl = "";
        let body = {};

        if (competitor.platform === 'instagram') {
          runUrl = `https://api.apify.com/v2/acts/${INSTAGRAM_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&memory=256`;
          body = { usernames: [competitor.username] };
        } else if (competitor.platform === 'tiktok') {
          runUrl = `https://api.apify.com/v2/acts/${TIKTOK_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&memory=256`;
          body = { profiles: [competitor.username], resultsPerPage: 1 };
        } else if (competitor.platform === 'youtube') {
          runUrl = `https://api.apify.com/v2/acts/${YOUTUBE_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&memory=256`;
          const url = competitor.username.includes('youtube.com') ? competitor.username : `https://www.youtube.com/@${competitor.username.replace('@', '')}`;
          body = { urls: [url] };
        }

        console.log(`[Apify] Rufe ab: ${competitor.platform} - ${competitor.username}`);
        
        const run = await fetch(runUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!run.ok) throw new Error(`Apify Error: ${run.status}`);
        
        const data = await run.json();
        const profile = data[0];

        if (profile) {
          let stats = { followers: 0, posts: 0, likes: 0, following: 0, engagement: 0 };

          if (competitor.platform === 'instagram') {
            stats.followers = profile.followersCount || profile.followers || 0;
            stats.posts = profile.postsCount || profile.posts || 0;
            stats.following = profile.followsCount || profile.following || 0;
          } else if (competitor.platform === 'tiktok') {
            const s = profile.stats || profile;
            stats.followers = s.followerCount || s.followers || 0;
            stats.posts = s.videoCount || s.videos || 0;
            stats.likes = s.heartCount || s.likes || 0;
          } else if (competitor.platform === 'youtube') {
            stats.followers = profile.subscriberCount || profile.subscribers || 0;
            stats.posts = profile.videoCount || profile.videos || 0;
            stats.likes = profile.viewCount || 0;
          }

          // Engagement Rate berechnen (vereinfacht)
          if (stats.followers > 0 && stats.posts > 0) {
            stats.engagement = parseFloat(((stats.likes / stats.followers) * 100).toFixed(2)) || 0;
          }

          console.log(`[Success] ${competitor.username}: ${stats.followers} Follower`);

          await supabase.from("competitor_metrics").insert({
            competitor_id: competitor.id,
            followers_count: stats.followers,
            following_count: stats.following,
            posts_count: stats.posts,
            engagement_rate: stats.engagement,
          });
          results.push({ user: competitor.username, status: "updated", stats });
        } else {
          console.log(`[Empty] Keine Daten für ${competitor.username}`);
          results.push({ user: competitor.username, status: "empty" });
        }

      } catch (err: any) {
        console.error(`[Error] ${competitor.username}:`, err.message);
        results.push({ user: competitor.username, error: err.message });
      }
    }

    return new Response(JSON.stringify({ results }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    console.error("[Competitors] Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
