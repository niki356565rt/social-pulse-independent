import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Authentifizierung prüfen
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Nicht autorisiert', hashtags: [] }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[Hashtags] Auth error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Nicht autorisiert', hashtags: [] }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[Hashtags] Authentifizierter User: ${user.id}`);

    const { content, platform } = await req.json();
    
    if (!content || content.trim().length < 3) {
      return new Response(JSON.stringify({ 
        hashtags: [],
        error: "Bitte gib zuerst einen Text ein (min. 3 Zeichen)"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY nicht konfiguriert');

    console.log(`[Hashtags] Generiere für ${platform}: "${content.substring(0, 50)}..."`);

    const prompt = `Du bist ein Social Media Experte. Generiere 10 passende Hashtags für diesen ${platform || 'Social Media'} Post.

Post-Text: "${content}"

Regeln:
- Gib genau 10 Hashtags zurück
- Mische populäre und Nischen-Hashtags
- Ohne # Symbol
- Antworte AUSSCHLIESSLICH mit diesem JSON-Format (kein Markdown, kein Text drumherum):
{"hashtags":[{"tag":"beispiel","category":"general","popularity":"medium"}]}

Kategorien: general, niche, trending, branded
Popularity: low, medium, high`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Du bist ein Hashtag-Generator. Antworte NUR mit validem JSON, ohne Markdown-Formatierung." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Hashtags] API Error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate-Limit erreicht. Bitte warte kurz.");
      }
      if (response.status === 402) {
        throw new Error("AI-Credits aufgebraucht.");
      }
      throw new Error("AI-Service nicht verfügbar");
    }

    const aiResponse = await response.json();
    let text = aiResponse.choices?.[0]?.message?.content || "";
    
    // Clean Markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log("[Hashtags] Raw response:", text.substring(0, 200));

    try {
      const data = JSON.parse(text);
      console.log("[Hashtags] Erfolgreich:", data.hashtags?.length, "Hashtags");
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    } catch (parseError) {
      console.error("[Hashtags] JSON Parse Error:", parseError);
      // Fallback: Versuche Hashtags aus dem Text zu extrahieren
      const matches = text.match(/[a-zA-Z0-9äöüÄÖÜß]+/g) || [];
      const fallbackHashtags = matches.slice(0, 10).map((tag: string) => ({
        tag: tag.toLowerCase(),
        category: "general",
        popularity: "medium"
      }));
      
      return new Response(JSON.stringify({ hashtags: fallbackHashtags }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

  } catch (error: any) {
    console.error("[Hashtags] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message, hashtags: [] }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
