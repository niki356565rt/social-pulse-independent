import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { content, platform } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY missing');

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Generiere 10 passende Hashtags für diesen ${platform} Post: "${content}".
    Antworte AUSSCHLIESSLICH mit diesem JSON Format (kein Markdown):
    { "hashtags": [ { "tag": "beispiel", "category": "general", "popularity": "medium" } ] }`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    // Clean Markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(text);

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});