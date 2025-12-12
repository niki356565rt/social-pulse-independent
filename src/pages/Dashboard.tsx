import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { FollowerChart } from "@/components/dashboard/FollowerChart";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { TopPostsWidget } from "@/components/dashboard/TopPostsWidget";
import { AIInsightsWidget } from "@/components/dashboard/AIInsightsWidget";
import { PeriodComparison } from "@/components/dashboard/PeriodComparison";
import { Users, Heart, Eye, TrendingUp, Download, Plus, Loader2, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useMetricsExport } from "@/hooks/useMetricsExport";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function formatNumber(num: number): string {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("de-DE");
}

const Dashboard = () => {
  const { accounts, loading: accountsLoading } = useSocialAccounts();
  
  // State für Filter - kein "all" mehr, direkt den ersten Account wählen
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  // Auto-select first account when accounts are loaded
  useState(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  });
  
  // Effect to set first account when accounts load
  if (accounts.length > 0 && !selectedAccountId) {
    setSelectedAccountId(accounts[0].id);
  }

  // Pass selectedAccountId to the hook for proper filtering
  const { stats, followerHistory, engagementHistory, loading, hasAccounts, refetch } = useDashboardMetrics(selectedAccountId);
  const { exportMetrics, exporting } = useMetricsExport();

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast.success("Daten aktualisiert");
  };

  // Charts filtern - immer nach gewähltem Account
  const filteredFollowerHistory = useMemo(() => {
    if (!selectedAccountId) return followerHistory;
    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return followerHistory;
    
    return followerHistory.map(item => ({
      ...item,
      instagram: account.platform === 'instagram' ? item.instagram : 0,
      tiktok: account.platform === 'tiktok' ? item.tiktok : 0,
      youtube: account.platform === 'youtube' ? item.youtube : 0,
    }));
  }, [selectedAccountId, followerHistory, accounts]);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header mit Aktionen */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
            <p className="text-muted-foreground">Dein Social Media Überblick</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Account Filter - ohne "Alle Accounts" */}
            {hasAccounts && accounts.length > 0 && (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground"/>
                  <SelectValue placeholder="Account wählen" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.platform === 'instagram' ? '📸' : acc.platform === 'youtube' ? '📺' : '🎵'} @{acc.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Refresh Button */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh} 
              disabled={refreshing || loading}
              title="Daten aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Button variant="outline" onClick={exportMetrics} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export
            </Button>
          </div>
        </div>

        {/* No accounts banner */}
        {!loading && !hasAccounts && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Noch keine Daten?</h3>
              <p className="text-muted-foreground">Verbinde deinen ersten Account, um loszulegen.</p>
            </div>
            <Link to="/accounts">
              <Button>Account verbinden <Plus className="ml-2 w-4 h-4"/></Button>
            </Link>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
             Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          ) : (
            <>
              <KPICard
                title="Follower Gesamt"
                value={formatNumber(stats.totalFollowers)}
                change={stats.followerChange}
                changeLabel="vs. letzter Monat"
                icon={Users}
                color="cyan"
              />
              <KPICard
                title="Engagement Rate"
                value={`${stats.engagementRate}%`}
                change={stats.engagementChange}
                changeLabel="vs. letzter Monat"
                icon={Heart}
                color="pink"
              />
              <KPICard
                title="Impressions"
                value={formatNumber(stats.totalImpressions)}
                change={stats.impressionsChange}
                changeLabel="vs. letzter Monat"
                icon={Eye}
                color="purple"
              />
              <KPICard
                title="Reichweite"
                value={formatNumber(stats.totalReach)}
                change={stats.reachChange}
                changeLabel="vs. letzter Monat"
                icon={TrendingUp}
                color="green"
              />
            </>
          )}
        </div>

        {/* Charts & AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <FollowerChart data={filteredFollowerHistory} />
            <EngagementChart data={engagementHistory} />
            <PeriodComparison selectedAccountId={selectedAccountId} />
          </div>
          <div className="space-y-6">
            <AIInsightsWidget selectedAccountId={selectedAccountId} />
            <TopPostsWidget selectedAccountId={selectedAccountId} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
