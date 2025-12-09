import { LucideIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface LockedKPICardProps {
  title: string;
  icon: LucideIcon;
  color?: "cyan" | "purple" | "pink" | "green";
}

const colorVariants = {
  cyan: "text-primary bg-primary/10",
  purple: "text-accent bg-accent/10",
  pink: "text-instagram bg-instagram/10",
  green: "text-chart-4 bg-chart-4/10",
};

export const LockedKPICard = ({ 
  title, 
  icon: Icon,
  color = "cyan" 
}: LockedKPICardProps) => {
  return (
    <Link to="/subscription" className="block">
      <div className="kpi-card opacity-60 hover:opacity-80 transition-opacity cursor-pointer relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent" />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorVariants[color])}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <Lock className="w-4 h-4" />
              Pro
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-muted-foreground/50">---</p>
            <p className="text-xs text-muted-foreground mt-1">Upgrade für Zugang</p>
          </div>
        </div>
      </div>
    </Link>
  );
};
