import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface MetricChange {
  accountId: string;
  platform: string;
  username: string;
  previousFollowers: number;
  currentFollowers: number;
  changePercent: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting follower alert check...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all users with notification settings enabled
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('user_id, threshold_percent, email_notifications')
      .eq('email_notifications', true);

    if (settingsError) {
      console.error('Error fetching notification settings:', settingsError);
      throw settingsError;
    }

    if (!settings || settings.length === 0) {
      console.log('No users with notifications enabled');
      return new Response(JSON.stringify({ message: 'No users with notifications enabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const alertsSent: string[] = [];

    for (const setting of settings) {
      const { user_id, threshold_percent } = setting;
      console.log(`Checking alerts for user ${user_id} with threshold ${threshold_percent}%`);

      // Get user's connected accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('connected_accounts')
        .select('id, platform, username')
        .eq('user_id', user_id);

      if (accountsError || !accounts || accounts.length === 0) {
        console.log(`No accounts found for user ${user_id}`);
        continue;
      }

      const significantChanges: MetricChange[] = [];

      for (const account of accounts) {
        // Get the two most recent metrics for this account
        const { data: metrics, error: metricsError } = await supabase
          .from('social_metrics')
          .select('followers_count, recorded_at')
          .eq('account_id', account.id)
          .order('recorded_at', { ascending: false })
          .limit(2);

        if (metricsError || !metrics || metrics.length < 2) {
          console.log(`Not enough metrics for account ${account.id}`);
          continue;
        }

        const [current, previous] = metrics;
        const changePercent = ((current.followers_count - previous.followers_count) / previous.followers_count) * 100;

        console.log(`Account ${account.username}: ${previous.followers_count} -> ${current.followers_count} (${changePercent.toFixed(2)}%)`);

        if (Math.abs(changePercent) >= threshold_percent) {
          significantChanges.push({
            accountId: account.id,
            platform: account.platform,
            username: account.username,
            previousFollowers: previous.followers_count,
            currentFollowers: current.followers_count,
            changePercent,
          });
        }
      }

      if (significantChanges.length > 0) {
        // Get user email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user_id)
          .single();

        if (profileError || !profile?.email) {
          console.error(`Could not get email for user ${user_id}`);
          continue;
        }

        // Send notification email
        if (RESEND_API_KEY) {
          await sendAlertEmail(profile.email, significantChanges, threshold_percent);
          alertsSent.push(profile.email);
          console.log(`Alert email sent to ${profile.email}`);
        } else {
          console.warn('RESEND_API_KEY not configured, skipping email');
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      alertsSent,
      message: `Checked all users, sent ${alertsSent.length} alerts` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in check-follower-alerts:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendAlertEmail(email: string, changes: MetricChange[], threshold: number) {
  const changesHtml = changes.map(change => {
    const direction = change.changePercent > 0 ? '📈 gestiegen' : '📉 gesunken';
    const color = change.changePercent > 0 ? '#22c55e' : '#ef4444';
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${change.platform}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">@${change.username}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${change.previousFollowers.toLocaleString('de-DE')}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${change.currentFollowers.toLocaleString('de-DE')}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: ${color}; font-weight: bold;">
          ${change.changePercent > 0 ? '+' : ''}${change.changePercent.toFixed(2)}% ${direction}
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Follower-Alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🔔 Follower-Alert</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Signifikante Änderungen erkannt (Schwellenwert: ${threshold}%)</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Plattform</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Account</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Vorher</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Jetzt</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Änderung</th>
            </tr>
          </thead>
          <tbody>
            ${changesHtml}
          </tbody>
        </table>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
          Diese E-Mail wurde automatisch von deinem Social Media Dashboard gesendet.
        </p>
      </div>
    </body>
    </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Social Dashboard <onboarding@resend.dev>',
      to: [email],
      subject: `🔔 Follower-Alert: ${changes.length} signifikante Änderung${changes.length > 1 ? 'en' : ''}`,
      html: htmlContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Resend API error:', errorText);
    throw new Error(`Failed to send email: ${errorText}`);
  }

  return response.json();
}