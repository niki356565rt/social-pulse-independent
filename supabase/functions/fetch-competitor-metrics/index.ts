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

    if (!APIFY_TOKEN) throw new Error("APIFY_API_TOKEN fehlt in Secrets!");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: competitors } = await supabase.from("competitors").select("*");

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
        const profile = data[0]; // Das erste Ergebnis nehmen

        if (profile) {
            let stats = { followers: 0, posts: 0, likes: 0, following: 0 };

            // Robuste Daten-Extraktion (prüft verschiedene Schreibweisen)
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
                stats.likes = profile.viewCount || 0; // Views als "Likes" Ersatz
            }

            console.log(`[Success] ${competitor.username}: ${stats.followers} Follower`);

            await supabase.from("competitor_metrics").insert({
                competitor_id: competitor.id,
                followers_count: stats.followers,
                following_count: stats.following,
                posts_count: stats.posts,
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

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});