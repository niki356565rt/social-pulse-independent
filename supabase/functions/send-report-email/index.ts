import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendReportRequest {
  recipientEmail: string;
  reportType: 'week' | 'month';
  pdfBase64: string;
  filename: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { recipientEmail, reportType, pdfBase64, filename }: SendReportRequest = await req.json();

    if (!recipientEmail || !pdfBase64 || !filename) {
      throw new Error('Missing required fields');
    }

    console.log(`Sending ${reportType} report to ${recipientEmail}`);

    const reportTypeText = reportType === 'week' ? 'Wochenbericht' : 'Monatsbericht';
    const currentDate = new Date().toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });

    const emailResponse = await resend.emails.send({
      from: "Social Media Reports <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Dein Social Media ${reportTypeText} - ${currentDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #6366f1; margin: 0; font-size: 28px; }
            .content { background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 30px; }
            .highlight { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Social Media Report</h1>
            </div>
            <div class="content">
              <p>Hallo!</p>
              <p>Im Anhang findest du deinen <strong>${reportTypeText}</strong> mit allen wichtigen KPIs und Metriken deiner Social Media Accounts.</p>
              <div class="highlight">
                <strong>📎 ${filename}</strong>
              </div>
              <p>Der Report enthält:</p>
              <ul>
                <li>Follower-Entwicklung</li>
                <li>Engagement-Raten</li>
                <li>Likes, Kommentare & Views</li>
                <li>Wachstumsanalyse</li>
              </ul>
            </div>
            <div class="footer">
              <p>Dieser Report wurde automatisch erstellt.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBase64,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending report email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
