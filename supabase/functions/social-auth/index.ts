import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper für TikTok PKCE
async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. ENVIRONMENT CHECK (Debugging)
    const TIKTOK_CLIENT_KEY = Deno.env.get("TIKTOK_CLIENT_KEY");
    const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET");
    const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID");
    const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET");
    const YOUTUBE_CLIENT_ID = Deno.env.get("YOUTUBE_CLIENT_ID");
    const YOUTUBE_CLIENT_SECRET = Deno.env.get("YOUTUBE_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("[DEBUG] Env Vars Check:");
    console.log("TikTok Key present:", !!TIKTOK_CLIENT_KEY);
    console.log("IG App ID present:", !!INSTAGRAM_APP_ID);
    console.log("Supabase URL present:", !!SUPABASE_URL);

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Supabase Konfiguration fehlt.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action, platform, code, redirectUri, userId } = body;

    console.log(`[DEBUG] Action: ${action}, Platform: ${platform}`);

    // --- 1. GET AUTH URL ---
    if (action === "get-auth-url") {
      let authUrl = "";
      
      if (platform === "instagram") {
        if (!INSTAGRAM_APP_ID) throw new Error("INSTAGRAM_APP_ID fehlt in Secrets");
        const scopes = "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement";
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=instagram`;
      } 
      else if (platform === "youtube") {
        if (!YOUTUBE_CLIENT_ID) throw new Error("YOUTUBE_CLIENT_ID fehlt in Secrets");
        const scopes = "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.upload";
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent&state=youtube`;
      }
      else if (platform === "tiktok") {
        if (!TIKTOK_CLIENT_KEY) throw new Error("TIKTOK_CLIENT_KEY fehlt in Secrets! Bitte 'npx supabase secrets set' ausführen.");
        
        const scopes = "user.info.basic,video.list";
        const codeVerifier = body.codeVerifier;
        if (!codeVerifier) return new Response(JSON.stringify({ error: "TikTok benötigt codeVerifier" }), { status: 400, headers: corsHeaders });
        
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        // ACHTUNG: TikTok URL ist sehr empfindlich auf Leerzeichen/Formatierung
        authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=tiktok&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      }

      console.log(`[DEBUG] Generated URL for ${platform}: ${authUrl}`);
      return new Response(JSON.stringify({ authUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- 2. EXCHANGE TOKEN ---
    if (action === "exchange-token") {
      let userData: any = null;

      // INSTAGRAM
      if (platform === "instagram") {
        if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) throw new Error("Instagram Secrets fehlen.");

        console.log("[DEBUG] Fetching IG Short Token...");
        const tokenRes = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: INSTAGRAM_APP_ID,
            client_secret: INSTAGRAM_APP_SECRET,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code,
          }),
        });
        
        const tokenData = await tokenRes.json();
        if (tokenData.error) {
            console.error("[ERROR] IG Token Error:", tokenData.error);
            throw new Error("FB Token Error: " + tokenData.error.message);
        }

        console.log("[DEBUG] Exchanging for Long Token...");
        const llRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${INSTAGRAM_APP_ID}&client_secret=${INSTAGRAM_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`);
        const llData = await llRes.json();
        const accessToken = llData.access_token || tokenData.access_token;

        console.log("[DEBUG] Fetching Pages...");
        const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
        const pagesData = await pagesRes.json();
        
        if (!pagesData.data || pagesData.data.length === 0) {
            throw new Error("Keine Facebook-Seite gefunden. Stelle sicher, dass du Admin einer Seite bist.");
        }

        let igData = null;
        let pageToken = null;

        // Loop through pages to find connected IG account
        for (const page of pagesData.data) {
            const res = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
            const data = await res.json();
            if (data.instagram_business_account) {
                igData = data.instagram_business_account;
                pageToken = page.access_token; // Important: Use Page Token!
                console.log("[DEBUG] Found IG Account linked to page:", page.name);
                break;
            }
        }

        if (!igData) throw new Error("Keine verknüpfte Instagram-Seite gefunden. Ist dein Instagram-Konto ein Business-Account und mit der FB-Seite verknüpft?");

        // Get User Info
        const userRes = await fetch(`https://graph.facebook.com/v18.0/${igData.id}?fields=username,name,profile_picture_url,followers_count&access_token=${pageToken}`);
        const userInfo = await userRes.json();

        userData = { 
            platform_user_id: igData.id, 
            username: userInfo.username,
            access_token: pageToken 
        };
      }

      // TIKTOK
      else if (platform === "tiktok") {
        if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) throw new Error("TikTok Secrets fehlen.");
        
        const codeVerifier = body.codeVerifier;
        if (!codeVerifier) throw new Error("Code Verifier fehlt (TikTok)");

        console.log("[DEBUG] Exchanging TikTok Token...");
        const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_key: TIKTOK_CLIENT_KEY,
                client_secret: TIKTOK_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }),
        });
        const tokenData = await tokenRes.json();
        
        if (tokenData.error) {
            console.error("[ERROR] TikTok Token:", tokenData);
            throw new Error("TikTok Token Error: " + tokenData.error_description || JSON.stringify(tokenData));
        }
        
        console.log("[DEBUG] Fetching TikTok User Info...");
        const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const userInfo = await userRes.json();
        
        userData = {
            platform_user_id: userInfo.data?.user?.open_id,
            username: userInfo.data?.user?.display_name,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in
        };
      }
      
      // YOUTUBE (bleibt gleich, der Kürze halber hier nur der Upsert)
      else if (platform === "youtube") {
         // ... (YouTube Code von vorhin hier einfügen falls nötig, oder oben lassen wenn er funktioniert)
         // Der Logik halber gehen wir davon aus, dass YT funktioniert.
         throw new Error("YouTube Code nicht im Debug-Snippet enthalten (siehe vorherigen Code)");
      }

      if (userData) {
        console.log(`[DEBUG] Saving user data for ${platform}:`, userData.username);
        const { error: dbError } = await supabase.from("connected_accounts").upsert({
            user_id: userId,
            platform,
            platform_user_id: userData.platform_user_id,
            username: userData.username,
            access_token: userData.access_token,
            refresh_token: userData.refresh_token,
        }, { onConflict: "user_id,platform" });

        if (dbError) {
             console.error("[ERROR] DB Upsert failed:", dbError);
             throw new Error("Datenbankfehler beim Speichern.");
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      throw new Error("Fehler beim Abrufen der Nutzerdaten (Keine Daten erhalten)");
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });

  } catch (error: any) {
    console.error("[CRITICAL ERROR]", error);
    return new Response(JSON.stringify({ error: error.message, details: error.toString() }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});