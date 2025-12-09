import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY missing");

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error("Unauthorized");

    // Daten holen
    const { data: accounts } = await supabase
      .from('connected_accounts')
      .select('id, platform, username')
      .eq('user_id', user.id);

    if (!accounts?.length) {
      return new Response(JSON.stringify({ insights: "Bitte verbinde Accounts." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const accountIds = accounts.map(a => a.id);
    const { data: metrics } = await supabase.from('social_metrics').select('*').in('account_id', accountIds).limit(50);
    const { data: posts } = await supabase.from('posts').select('*').in('account_id', accountIds).limit(20);

    // Zusammenfassung erstellen
    const summary = accounts.map(acc => {
        const accMetrics = metrics?.filter(m => m.account_id === acc.id) || [];
        const accPosts = posts?.filter(p => p.account_id === acc.id) || [];
        return {
            platform: acc.platform,
            username: acc.username,
            followers: accMetrics[0]?.followers_count || 0,
            recent_posts: accPosts.length
        };
    });

    const prompt = `Analysiere diese Social Media Daten:
    ${JSON.stringify(summary, null, 2)}
    
    Gib mir 3 kurze, strategische Tipps auf Deutsch für mehr Wachstum.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(JSON.stringify({ 
      insights: text,
      generatedAt: new Date().toISOString() 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});