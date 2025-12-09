import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { postId } = await req.json();
    
    // Supabase Client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Post und Token holen
    const { data: post, error: postError } = await supabase
      .from("scheduled_posts") // Stellen Sie sicher, dass Ihre Tabelle scheduled_posts oder posts heißt
      .select("*, connected_accounts!inner(access_token)")
      .eq("id", postId)
      .single();

    if (postError || !post) throw new Error("Post nicht gefunden: " + (postError?.message || ""));
    
    // Token prüfen
    if (!post.connected_accounts.access_token) throw new Error("Kein YouTube Access Token vorhanden. Bitte Account neu verbinden.");

    // 2. Video URL holen
    // Wir nehmen an, media_urls ist ein Array von Strings
    const videoUrl = Array.isArray(post.media_urls) ? post.media_urls[0] : post.media_url;
    if (!videoUrl) throw new Error("Keine Video-URL im Post gefunden.");

    console.log(`Lade Video herunter: ${videoUrl}`);
    const videoBlob = await fetch(videoUrl).then(r => r.blob());

    // 3. Titel und Beschreibung trennen
    // Wir hatten im Frontend vereinbart: "TITLE: Mein Titel\n\nBeschreibung"
    let title = "Neues Video";
    let description = post.content || "";
    
    if (post.content?.includes("TITLE:")) {
        const parts = post.content.split("\n");
        // Suche die Zeile mit TITLE:
        const titleLine = parts.find(p => p.startsWith("TITLE:"));
        if (titleLine) {
            title = titleLine.replace("TITLE:", "").trim();
            // Der Rest ist Beschreibung
            description = post.content.replace(titleLine, "").trim();
        }
    }

    console.log(`Starte Upload für: ${title}`);

    // 4. YouTube Resumable Upload Session starten
    const initRes = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${post.connected_accounts.access_token}`,
            "Content-Type": "application/json",
            "X-Upload-Content-Length": String(videoBlob.size),
            "X-Upload-Content-Type": "video/mp4"
        },
        body: JSON.stringify({
            snippet: {
                title: title,
                description: description,
                tags: ["SocialPulse"] // Optional
            },
            status: {
                privacyStatus: "private" // WICHTIG: Erstmal auf Private setzen zum Testen
            }
        })
    });

    if (!initRes.ok) {
        const err = await initRes.text();
        throw new Error(`YouTube Init Error: ${err}`);
    }
    
    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) throw new Error("Keine Upload URL von YouTube erhalten.");

    // 5. Das Video-Binary hochladen
    const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Length": String(videoBlob.size),
            "Content-Type": "video/mp4"
        },
        body: videoBlob
    });

    if (!uploadRes.ok) {
         const err = await uploadRes.text();
         throw new Error(`YouTube Upload Error: ${err}`);
    }

    const uploadData = await uploadRes.json();
    console.log("Upload erfolgreich:", uploadData.id);

    // 6. Status in DB auf 'published' setzen
    await supabase.from("scheduled_posts").update({
        status: "published",
        published_at: new Date().toISOString(),
        platform_post_id: uploadData.id
    }).eq("id", postId);

    return new Response(JSON.stringify({ success: true, youtubeId: uploadData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});