import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { de } from "date-fns/locale";

export type PeriodType = "week" | "month";

export interface PeriodMetrics {
  totalFollowers: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  avgEngagement: number;
  postsCount: number;
}

export interface PeriodComparison {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  changes: {
    followers: number;
    likes: number;
    comments: number;
    views: number;
    engagement: number;
    posts: number;
  };
  periodLabel: {
    current: string;
    previous: string;
  };
}

const defaultMetrics: PeriodMetrics = {
  totalFollowers: 0,
  totalLikes: 0,
  totalComments: 0,
  totalViews: 0,
  avgEngagement: 0,
  postsCount: 0,
};

export function usePeriodComparison() {
  const { user } = useAuth();
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>("week");

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchComparison = useCallback(async (type: PeriodType = periodType) => {
    if (!user) return;

    setLoading(true);
    setPeriodType(type);

    try {
      // Get date ranges
      const now = new Date();
      let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;
      let currentLabel: string, previousLabel: string;

      if (type === "week") {
        currentStart = startOfWeek(now, { weekStartsOn: 1 });
        currentEnd = endOfWeek(now, { weekStartsOn: 1 });
        previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        previousEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        currentLabel = `Diese Woche (${format(currentStart, "dd.MM.", { locale: de })} - ${format(currentEnd, "dd.MM.", { locale: de })})`;
        previousLabel = `Letzte Woche (${format(previousStart, "dd.MM.", { locale: de })} - ${format(previousEnd, "dd.MM.", { locale: de })})`;
      } else {
        currentStart = startOfMonth(now);
        currentEnd = endOfMonth(now);
        previousStart = startOfMonth(subMonths(now, 1));
        previousEnd = endOfMonth(subMonths(now, 1));
        currentLabel = format(currentStart, "MMMM yyyy", { locale: de });
        previousLabel = format(previousStart, "MMMM yyyy", { locale: de });
      }

      // Get user's connected accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("connected_accounts")
        .select("id")
        .eq("user_id", user.id);

      if (accountsError) throw accountsError;
      if (!accounts || accounts.length === 0) {
        setComparison(null);
        setLoading(false);
        return;
      }

      const accountIds = accounts.map(a => a.id);

      // Fetch metrics for current period
      const { data: currentData } = await supabase
        .from("social_metrics")
        .select("*")
        .in("account_id", accountIds)
        .gte("recorded_at", currentStart.toISOString())
        .lte("recorded_at", currentEnd.toISOString());

      // Fetch metrics for previous period
      const { data: previousData } = await supabase
        .from("social_metrics")
        .select("*")
        .in("account_id", accountIds)
        .gte("recorded_at", previousStart.toISOString())
        .lte("recorded_at", previousEnd.toISOString());

      // Calculate metrics for each period
      const calculatePeriodMetrics = (data: any[] | null): PeriodMetrics => {
        if (!data || data.length === 0) return defaultMetrics;

        // Get latest metrics per account within the period
        const latestByAccount: Record<string, any> = {};
        data.forEach(m => {
          if (!latestByAccount[m.account_id] || 
              new Date(m.recorded_at) > new Date(latestByAccount[m.account_id].recorded_at)) {
            latestByAccount[m.account_id] = m;
          }
        });

        const latestMetrics = Object.values(latestByAccount);
        
        let totalFollowers = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalViews = 0;
        let engagementSum = 0;
        let engagementCount = 0;
        let postsCount = 0;

        latestMetrics.forEach((m: any) => {
          totalFollowers += m.followers_count || 0;
          totalLikes += m.likes_count || 0;
          totalComments += m.comments_count || 0;
          totalViews += m.views_count || 0;
          postsCount += m.posts_count || 0;
          if (m.engagement_rate) {
            engagementSum += parseFloat(m.engagement_rate);
            engagementCount++;
          }
        });

        return {
          totalFollowers,
          totalLikes,
          totalComments,
          totalViews,
          avgEngagement: engagementCount > 0 ? engagementSum / engagementCount : 0,
          postsCount,
        };
      };

      const currentMetrics = calculatePeriodMetrics(currentData);
      const previousMetrics = calculatePeriodMetrics(previousData);

      setComparison({
        current: currentMetrics,
        previous: previousMetrics,
        changes: {
          followers: calculateChange(currentMetrics.totalFollowers, previousMetrics.totalFollowers),
          likes: calculateChange(currentMetrics.totalLikes, previousMetrics.totalLikes),
          comments: calculateChange(currentMetrics.totalComments, previousMetrics.totalComments),
          views: calculateChange(currentMetrics.totalViews, previousMetrics.totalViews),
          engagement: calculateChange(currentMetrics.avgEngagement, previousMetrics.avgEngagement),
          posts: calculateChange(currentMetrics.postsCount, previousMetrics.postsCount),
        },
        periodLabel: {
          current: currentLabel,
          previous: previousLabel,
        },
      });
    } catch (error) {
      console.error("Error fetching period comparison:", error);
    } finally {
      setLoading(false);
    }
  }, [user, periodType]);

  return {
    comparison,
    loading,
    periodType,
    fetchComparison,
  };
}