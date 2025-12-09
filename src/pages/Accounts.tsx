import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Trash2, Loader2, Lock } from "lucide-react";
import { useSocialAccounts, AccountWithMetrics } from "@/hooks/useSocialAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const platformConfig = {
  instagram: {
    name: "Instagram",
    color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    icon: "📸",
  },
  tiktok: {
    name: "TikTok",
    color: "bg-foreground",
    icon: "🎵",
  },
  youtube: {
    name: "YouTube",
    color: "bg-red-600",
    icon: "▶️",
  },
};

const availablePlatforms = ["instagram", "tiktok", "youtube"] as const;

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("de-DE");
}

function AccountCard({
  account,
  onRefresh,
  onDisconnect,
  isRefreshing,
}: {
  account: AccountWithMetrics;
  onRefresh: () => void;
  onDisconnect: () => void;
  isRefreshing: boolean;
}) {
  const config = platformConfig[account.platform];
  const metrics = account.latestMetrics;

  return (
    <div className="kpi-card flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center text-2xl`}>
          {config.icon}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{config.name}</h3>
          <p className="text-sm text-muted-foreground">@{account.username}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-2xl font-bold">{formatNumber(metrics?.followers_count)}</p>
          <p className="text-xs text-muted-foreground">Follower</p>
        </div>

        {metrics?.engagement_rate && (
          <div className="text-right hidden sm:block">
            <p className="text-lg font-semibold text-primary">{metrics.engagement_rate}%</p>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDisconnect}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConnectPlatformCard({
  platform,
  onConnect,
  disabled,
}: {
  platform: "instagram" | "tiktok" | "youtube";
  onConnect: () => void;
  disabled?: boolean;
}) {
  const config = platformConfig[platform];

  return (
    <div className="kpi-card flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center text-2xl grayscale`}>
          {config.icon}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{config.name}</h3>
          <p className="text-sm text-muted-foreground italic">Nicht verbunden</p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onConnect} disabled={disabled}>
        {disabled ? <Lock className="w-4 h-4 mr-1" /> : null}
        Verbinden
      </Button>
    </div>
  );
}

const Accounts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    accounts,
    loading,
    refreshing,
    connectAccount,
    handleOAuthCallback,
    refreshMetrics,
    disconnectAccount,
    accountLimit,
    canAddMoreAccounts,
  } = useSocialAccounts();

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    console.log("[ACCOUNTS] ========== OAuth Callback Check ==========");
    console.log("[ACCOUNTS] URL:", window.location.href);
    console.log("[ACCOUNTS] Search params:", Object.fromEntries(searchParams.entries()));
    console.log("[ACCOUNTS] Code present:", !!code);
    console.log("[ACCOUNTS] State:", state);
    console.log("[ACCOUNTS] Error:", error);
    console.log("[ACCOUNTS] Error description:", errorDescription);

    if (error) {
      console.error("[ACCOUNTS] OAuth Error received:", error, errorDescription);
      toast.error(`OAuth Fehler: ${errorDescription || error}`);
      setSearchParams({});
      return;
    }

    if (code && state) {
      console.log("[ACCOUNTS] Valid OAuth callback, processing...");
      handleOAuthCallback(code, state);
      // Clean up URL
      setSearchParams({});
    } else {
      console.log("[ACCOUNTS] No OAuth callback parameters found");
    }
  }, [searchParams, setSearchParams, handleOAuthCallback]);

  const connectedPlatforms = accounts.map((a) => a.platform);
  const disconnectedPlatforms = availablePlatforms.filter(
    (p) => !connectedPlatforms.includes(p)
  );

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Verbundene Accounts</h1>
            <p className="text-muted-foreground">Verwalte deine Social Media Accounts</p>
          </div>
          <Button
            variant="outline"
            onClick={() => refreshMetrics()}
            disabled={refreshing === "all" || accounts.length === 0}
          >
            {refreshing === "all" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Alle aktualisieren
          </Button>
        </div>

        {/* Accounts List */}
        <div className="space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : (
            <>
              {/* Connected accounts */}
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onRefresh={() => refreshMetrics(account.id)}
                  onDisconnect={() => disconnectAccount(account.id)}
                  isRefreshing={refreshing === account.id}
                />
              ))}

              {/* Disconnected platforms */}
              {disconnectedPlatforms.map((platform) => (
                <ConnectPlatformCard
                  key={platform}
                  platform={platform}
                  onConnect={() => connectAccount(platform)}
                  disabled={!canAddMoreAccounts}
                />
              ))}

              {/* Account limit info */}
              {!canAddMoreAccounts && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-destructive" />
                      <div>
                        <p className="font-medium">Account-Limit erreicht ({accounts.length}/{accountLimit})</p>
                        <p className="text-sm text-muted-foreground">Upgrade deinen Plan für mehr Accounts</p>
                      </div>
                    </div>
                    <Link to="/subscription">
                      <Button variant="gradient" size="sm">Upgrade</Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 rounded-xl bg-primary/5 border border-primary/20">
          <h3 className="font-semibold mb-2">💡 So verbindest du deine Accounts</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li><strong>Instagram:</strong> Benötigt einen Business- oder Creator-Account, der mit einer Facebook-Seite verbunden ist.</li>
            <li><strong>TikTok:</strong> Erfordert TikTok for Developers Zugang mit aktivierter App.</li>
            <li><strong>YouTube:</strong> Gib deine Channel-ID ein, um öffentliche Statistiken abzurufen.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
