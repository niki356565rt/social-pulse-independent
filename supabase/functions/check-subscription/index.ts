import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free plan");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: "free",
        product_id: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    logStep("Subscriptions fetched", { count: subscriptions.data.length });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let plan = "free";

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      
      // Safely handle the timestamp conversion
      if (subscription.current_period_end) {
        try {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        } catch (e) {
          logStep("Error parsing subscription end date", { error: String(e) });
          subscriptionEnd = null;
        }
      }
      
      // Get product ID from subscription items
      if (subscription.items?.data?.[0]?.price?.product) {
        productId = subscription.items.data[0].price.product as string;
      }
      
      // Map product ID to plan name
      if (productId === "prod_TY2RgCkDlp7KdQ") plan = "pro";
      else if (productId === "prod_TY2RMi7mXZvgHE") plan = "premium";
      else if (productId === "prod_TY2SGDTpRePqJC") plan = "b2b";
      
      logStep("Active subscription found", { subscriptionId: subscription.id, plan, productId, subscriptionEnd });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      subscribed: false,
      plan: "free",
      product_id: null,
      subscription_end: null,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 with free plan on error to not break the UI
    });
  }
});
