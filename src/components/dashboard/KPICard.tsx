import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: LucideIcon;
  color?: "cyan" | "purple" | "pink" | "green";
}

const colorVariants = {
  cyan: "text-primary bg-primary/10",
  purple: "text-accent bg-accent/10",
  pink: "text-instagram bg-instagram/10",
  green: "text-chart-4 bg-chart-4/10",
};

export const KPICard = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon,
  color = "cyan" 
}: KPICardProps) => {
  const isPositive = change >= 0;

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorVariants[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium",
          isPositive ? "text-chart-4" : "text-destructive"
        )}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {isPositive && "+"}{change}%
        </div>
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{changeLabel}</p>
      </div>
    </div>
  );
};
