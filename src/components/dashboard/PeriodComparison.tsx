import { useEffect } from "react";
import { usePeriodComparison, PeriodType } from "@/hooks/usePeriodComparison";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Heart, 
  MessageCircle, 
  Eye,
  Percent,
  FileText,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonRowProps {
  label: string;
  icon: React.ReactNode;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  formatter?: (value: number) => string;
}

function ComparisonRow({ label, icon, currentValue, previousValue, changePercent, formatter }: ComparisonRowProps) {
  const formatValue = formatter || ((v: number) => v.toLocaleString("de-DE"));
  const isPositive = changePercent >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <span className="font-medium">{label}</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Vorher</p>
          <p className="font-medium text-muted-foreground">{formatValue(previousValue)}</p>
        </div>
        
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Aktuell</p>
          <p className="font-semibold">{formatValue(currentValue)}</p>
        </div>
        
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium min-w-[80px] justify-center",
          isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
        )}>
          <TrendIcon className="w-3 h-3" />
          <span>{isPositive ? "+" : ""}{changePercent.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function PeriodComparison() {
  const { comparison, loading, periodType, fetchComparison } = usePeriodComparison();

  useEffect(() => {
    fetchComparison("week");
  }, []);

  const handlePeriodChange = (type: PeriodType) => {
    fetchComparison(type);
  };

  const formatEngagement = (value: number) => `${value.toFixed(2)}%`;

  if (loading) {
    return (
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="kpi-card">
        <h3 className="text-lg font-semibold mb-4">Zeitraum-Vergleich</h3>
        <p className="text-muted-foreground text-sm">
          Verbinde Social Media Accounts, um Vergleichsdaten zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="kpi-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold">Zeitraum-Vergleich</h3>
          <p className="text-sm text-muted-foreground">
            {comparison.periodLabel.previous} vs. {comparison.periodLabel.current}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={periodType === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange("week")}
          >
            Woche
          </Button>
          <Button
            variant={periodType === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange("month")}
          >
            Monat
          </Button>
        </div>
      </div>

      <div>
        <ComparisonRow
          label="Follower"
          icon={<Users className="w-5 h-5 text-primary" />}
          currentValue={comparison.current.totalFollowers}
          previousValue={comparison.previous.totalFollowers}
          changePercent={comparison.changes.followers}
        />
        <ComparisonRow
          label="Likes"
          icon={<Heart className="w-5 h-5 text-primary" />}
          currentValue={comparison.current.totalLikes}
          previousValue={comparison.previous.totalLikes}
          changePercent={comparison.changes.likes}
        />
        <ComparisonRow
          label="Kommentare"
          icon={<MessageCircle className="w-5 h-5 text-primary" />}
          currentValue={comparison.current.totalComments}
          previousValue={comparison.previous.totalComments}
          changePercent={comparison.changes.comments}
        />
        <ComparisonRow
          label="Views"
          icon={<Eye className="w-5 h-5 text-primary" />}
          currentValue={comparison.current.totalViews}
          previousValue={comparison.previous.totalViews}
          changePercent={comparison.changes.views}
        />
        <ComparisonRow
          label="Engagement"
          icon={<Percent className="w-5 h-5 text-primary" />}
          currentValue={comparison.current.avgEngagement}
          previousValue={comparison.previous.avgEngagement}
          changePercent={comparison.changes.engagement}
          formatter={formatEngagement}
        />
        <ComparisonRow
          label="Posts"
          icon={<FileText className="w-5 h-5 text-primary" />}
          currentValue={comparison.current.postsCount}
          previousValue={comparison.previous.postsCount}
          changePercent={comparison.changes.posts}
        />
      </div>
    </div>
  );
}