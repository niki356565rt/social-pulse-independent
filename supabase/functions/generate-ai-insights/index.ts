import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY nicht konfiguriert");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Keine Authentifizierung");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error("Nicht autorisiert");

    // Daten holen
    const { data: accounts } = await supabase
      .from('connected_accounts')
      .select('id, platform, username')
      .eq('user_id', user.id);

    if (!accounts?.length) {
      return new Response(JSON.stringify({ insights: "Bitte verbinde zuerst Social Media Accounts, um AI-Insights zu erhalten." }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const accountIds = accounts.map(a => a.id);
    const { data: metrics } = await supabase.from('social_metrics').select('*').in('account_id', accountIds).limit(50);
    const { data: posts } = await supabase.from('posts').select('*').in('account_id', accountIds).limit(20);

    // Zusammenfassung erstellen
    const summary = accounts.map(acc => {
      const accMetrics = metrics?.filter(m => m.account_id === acc.id) || [];
      const accPosts = posts?.filter(p => p.account_id === acc.id) || [];
      const latestMetric = accMetrics[0];
      return {
        platform: acc.platform,
        username: acc.username,
        followers: latestMetric?.followers_count || 0,
        engagement_rate: latestMetric?.engagement_rate || 0,
        recent_posts: accPosts.length,
        avg_likes: accPosts.length > 0 ? Math.round(accPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0) / accPosts.length) : 0,
        avg_comments: accPosts.length > 0 ? Math.round(accPosts.reduce((sum, p) => sum + (p.comments_count || 0), 0) / accPosts.length) : 0,
      };
    });

    console.log("[AI Insights] Daten für", accounts.length, "Accounts gesammelt");

    const prompt = `Du bist ein Social Media Marketing Experte. Analysiere diese Social Media Daten und gib 3 kurze, konkrete und strategische Tipps auf Deutsch für mehr Wachstum.

Daten:
${JSON.stringify(summary, null, 2)}

Regeln:
- Maximal 3 Tipps
- Jeder Tipp sollte 1-2 Sätze lang sein
- Fokussiere auf actionable Insights
- Nutze die konkreten Zahlen wenn sinnvoll
- Antworte auf Deutsch`;

    // Lovable AI Gateway aufrufen
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Du bist ein hilfreicher Social Media Marketing Experte, der auf Deutsch antwortet." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Insights] API Error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate-Limit erreicht. Bitte versuche es in ein paar Minuten erneut.");
      }
      if (response.status === 402) {
        throw new Error("AI-Credits aufgebraucht. Bitte lade dein Guthaben auf.");
      }
      throw new Error("AI-Service temporär nicht verfügbar");
    }

    const aiResponse = await response.json();
    const text = aiResponse.choices?.[0]?.message?.content || "Keine Insights generiert.";

    console.log("[AI Insights] Erfolgreich generiert");

    return new Response(JSON.stringify({ 
      insights: text,
      generatedAt: new Date().toISOString() 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("[AI Insights] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
