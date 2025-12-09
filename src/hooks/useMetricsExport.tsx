import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscription } from "./useSubscription";
import { generateMetricsCSV, downloadCSV, getExportFilename } from "@/lib/csvExport";
import { toast } from "sonner";
import { format } from "date-fns";

export function useMetricsExport() {
  const { user } = useAuth();
  const { canAccess } = useSubscription();
  const [exporting, setExporting] = useState(false);

  const canExport = canAccess("csvExport");

  const exportMetrics = async () => {
    if (!user) {
      toast.error("Bitte melde dich zuerst an");
      return;
    }

    if (!canExport) {
      toast.error("CSV-Export ist nur für Pro+ Nutzer verfügbar");
      return;
    }

    setExporting(true);

    try {
      // Fetch all connected accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("connected_accounts")
        .select("id, platform, username")
        .eq("user_id", user.id);

      if (accountsError) throw accountsError;

      if (!accounts || accounts.length === 0) {
        toast.error("Keine verbundenen Accounts gefunden");
        return;
      }

      // Fetch all metrics for all accounts
      const { data: metrics, error: metricsError } = await supabase
        .from("social_metrics")
        .select("*")
        .in("account_id", accounts.map((a) => a.id))
        .order("recorded_at", { ascending: false });

      if (metricsError) throw metricsError;

      if (!metrics || metrics.length === 0) {
        toast.error("Keine Metriken zum Exportieren gefunden");
        return;
      }

      // Map accounts by ID for quick lookup
      const accountMap = new Map(accounts.map((a) => [a.id, a]));

      // Transform data for CSV
      const csvData = metrics.map((m) => {
        const account = accountMap.get(m.account_id);
        return {
          date: format(new Date(m.recorded_at), "dd.MM.yyyy HH:mm"),
          platform: account?.platform || "Unbekannt",
          username: account?.username || "Unbekannt",
          followers: m.followers_count,
          following: m.following_count,
          posts: m.posts_count,
          likes: m.likes_count,
          comments: m.comments_count,
          views: m.views_count,
          engagementRate: m.engagement_rate,
        };
      });

      const csvContent = generateMetricsCSV(csvData);
      downloadCSV(csvContent, getExportFilename());

      toast.success(`${metrics.length} Datensätze exportiert`);
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Fehler beim Exportieren der Daten");
    } finally {
      setExporting(false);
    }
  };

  return {
    exportMetrics,
    exporting,
    canExport,
  };
}
