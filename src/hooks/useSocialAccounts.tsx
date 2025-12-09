import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscription } from "./useSubscription";
import { getAccountLimit } from "@/lib/planLimits";
import { toast } from "sonner";

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: "instagram" | "tiktok" | "youtube";
  platform_user_id: string;
  username: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialMetrics {
  id: string;
  account_id: string;
  followers_count: number;
  following_count: number | null;
  posts_count: number | null;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  engagement_rate: number | null;
  recorded_at: string;
}

export interface AccountWithMetrics extends ConnectedAccount {
  latestMetrics?: SocialMetrics;
}

export function useSocialAccounts() {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const [accounts, setAccounts] = useState<AccountWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  
  const accountLimit = getAccountLimit(plan);
  const canAddMoreAccounts = accounts.length < accountLimit;

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch connected accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("user_id", user.id);

      if (accountsError) throw accountsError;

      // Fetch latest metrics for each account
      const accountsWithMetrics: AccountWithMetrics[] = await Promise.all(
        (accountsData || []).map(async (account) => {
          const { data: metricsData } = await supabase
            .from("social_metrics")
            .select("*")
            .eq("account_id", account.id)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...account,
            latestMetrics: metricsData || undefined,
          } as AccountWithMetrics;
        })
      );

      setAccounts(accountsWithMetrics);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      toast.error("Fehler beim Laden der Accounts");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Generate PKCE code verifier for TikTok
  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const connectAccount = async (platform: "instagram" | "tiktok" | "youtube") => {
    console.log("[DEBUG] connectAccount called for platform:", platform);
    
    if (!user) {
      console.log("[DEBUG] No user found, aborting");
      toast.error("Bitte melde dich zuerst an");
      return;
    }

    console.log("[DEBUG] User ID:", user.id);
    console.log("[DEBUG] Current plan:", plan);
    console.log("[DEBUG] Account limit:", accountLimit);
    console.log("[DEBUG] Current accounts:", accounts.length);
    console.log("[DEBUG] canAddMoreAccounts:", canAddMoreAccounts);

    // Check account limit (Infinity for b2b plan)
    if (!canAddMoreAccounts && accountLimit !== Infinity) {
      console.log("[DEBUG] Account limit reached:", accountLimit);
      toast.error(`Du hast das Limit von ${accountLimit} Account(s) erreicht. Upgrade für mehr Accounts.`, {
        duration: 5000,
      });
      return;
    }

    try {
      const redirectUri = `${window.location.origin}/accounts`;
      console.log("[DEBUG] Redirect URI:", redirectUri);
      console.log("[DEBUG] Window origin:", window.location.origin);

      // Generate PKCE code verifier for TikTok
      let codeVerifier: string | undefined;
      if (platform === "tiktok") {
        codeVerifier = generateCodeVerifier();
        console.log("[DEBUG] Generated code verifier for TikTok");
      }

      console.log("[DEBUG] Calling social-auth edge function with:", {
        action: "get-auth-url",
        platform,
        redirectUri,
        userId: user.id,
        codeVerifier: codeVerifier ? "present" : "none",
      });

      const response = await supabase.functions.invoke("social-auth", {
        body: {
          action: "get-auth-url",
          platform,
          redirectUri,
          userId: user.id,
          codeVerifier, // For TikTok PKCE
        },
      });

      console.log("[DEBUG] social-auth response:", response);
      console.log("[DEBUG] Response data:", response.data);
      console.log("[DEBUG] Response error:", response.error);

      if (response.error) throw response.error;
      
      if (response.data?.authUrl) {
        console.log("[DEBUG] Auth URL received:", response.data.authUrl);
        
        // Store state for callback (including codeVerifier for TikTok)
        const stateData = {
          platform,
          userId: user.id,
          redirectUri,
          codeVerifier, // Store for token exchange
        };
        console.log("[DEBUG] Storing state in sessionStorage:", { ...stateData, codeVerifier: codeVerifier ? "present" : "none" });
        sessionStorage.setItem("social_auth_state", JSON.stringify(stateData));
        
        console.log("[DEBUG] Redirecting to auth URL...");
        window.location.href = response.data.authUrl;
      } else {
        console.log("[DEBUG] No authUrl in response!");
      }
    } catch (error: any) {
      console.error("[DEBUG] Error connecting account:", error);
      console.error("[DEBUG] Error details:", JSON.stringify(error, null, 2));
      toast.error(`Fehler beim Verbinden: ${error.message}`);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    console.log("[DEBUG] handleOAuthCallback called");
    console.log("[DEBUG] Code received:", code ? `${code.substring(0, 20)}...` : "none");
    console.log("[DEBUG] State received:", state);
    
    const savedState = sessionStorage.getItem("social_auth_state");
    console.log("[DEBUG] Saved state from sessionStorage:", savedState);
    
    if (!savedState) {
      console.log("[DEBUG] No saved state found!");
      toast.error("OAuth Session abgelaufen");
      return;
    }

    const { platform, userId, redirectUri, codeVerifier } = JSON.parse(savedState);
    console.log("[DEBUG] Parsed state:", { platform, userId, redirectUri, codeVerifier: codeVerifier ? "present" : "none" });
    sessionStorage.removeItem("social_auth_state");

    try {
      console.log("[DEBUG] Calling social-auth edge function for token exchange:", {
        action: "exchange-token",
        platform,
        code: code ? `${code.substring(0, 20)}...` : "none",
        redirectUri,
        userId,
        codeVerifier: codeVerifier ? "present" : "none",
      });

      const response = await supabase.functions.invoke("social-auth", {
        body: {
          action: "exchange-token",
          platform,
          code,
          redirectUri,
          userId,
          codeVerifier, // For TikTok PKCE token exchange
        },
      });

      console.log("[DEBUG] Token exchange response:", response);
      console.log("[DEBUG] Response data:", response.data);
      console.log("[DEBUG] Response error:", response.error);

      if (response.error) throw response.error;
      
      console.log("[DEBUG] Account connected successfully!");
      toast.success(`${platform} erfolgreich verbunden!`);
      await fetchAccounts();
      
      // Refresh metrics immediately
      if (response.data?.account?.id) {
        console.log("[DEBUG] Refreshing metrics for new account:", response.data.account.id);
        await refreshMetrics(response.data.account.id);
      }
    } catch (error: any) {
      console.error("[DEBUG] OAuth callback error:", error);
      console.error("[DEBUG] Error details:", JSON.stringify(error, null, 2));
      toast.error(`Verbindung fehlgeschlagen: ${error.message}`);
    }
  };

  const refreshMetrics = async (accountId?: string) => {
    if (!user) return;

    setRefreshing(accountId || "all");

    try {
      const response = await supabase.functions.invoke("fetch-social-metrics", {
        body: accountId
          ? { accountId }
          : { userId: user.id, refreshAll: true },
      });

      if (response.error) throw response.error;

      const results = response.data?.results || [];
      const successful = results.filter((r: any) => r.success).length;
      const failed = results.filter((r: any) => !r.success).length;

      if (successful > 0) {
        toast.success(`${successful} Account(s) aktualisiert`);
      }
      if (failed > 0) {
        toast.error(`${failed} Account(s) fehlgeschlagen`);
      }

      await fetchAccounts();
    } catch (error: any) {
      console.error("Error refreshing metrics:", error);
      toast.error("Fehler beim Aktualisieren der Daten");
    } finally {
      setRefreshing(null);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("connected_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      toast.success("Account getrennt");
      await fetchAccounts();
    } catch (error: any) {
      console.error("Error disconnecting account:", error);
      toast.error("Fehler beim Trennen des Accounts");
    }
  };

  return {
    accounts,
    loading,
    refreshing,
    connectAccount,
    handleOAuthCallback,
    refreshMetrics,
    disconnectAccount,
    refetch: fetchAccounts,
    accountLimit,
    canAddMoreAccounts,
  };
}
