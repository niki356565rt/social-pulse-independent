import { useMemo } from "react";
import { Post } from "@/hooks/useTopPosts";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EngagementHeatmapProps {
  posts: Post[];
}

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const DAYS_FULL = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

// Map JS day (0=Sunday) to our display (0=Monday)
const mapDayToDisplay = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1);

export function EngagementHeatmap({ posts }: EngagementHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Create a 7x8 grid (7 days, 8 time slots of 3 hours each)
    const grid: { engagements: number[]; count: number }[][] = Array(7)
      .fill(null)
      .map(() =>
        Array(8)
          .fill(null)
          .map(() => ({ engagements: [], count: 0 }))
      );

    posts.forEach((post) => {
      if (!post.posted_at || post.engagement_rate === null) return;

      const date = new Date(post.posted_at);
      const hour = date.getHours();
      const dayOfWeek = mapDayToDisplay(date.getDay());
      const hourSlot = Math.floor(hour / 3);

      grid[dayOfWeek][hourSlot].engagements.push(post.engagement_rate);
      grid[dayOfWeek][hourSlot].count++;
    });

    // Calculate averages and find max for normalization
    let maxEngagement = 0;
    const processed = grid.map((day) =>
      day.map((slot) => {
        if (slot.count === 0) return { avg: null, count: 0 };
        const avg = slot.engagements.reduce((a, b) => a + b, 0) / slot.count;
        if (avg > maxEngagement) maxEngagement = avg;
        return { avg, count: slot.count };
      })
    );

    return { grid: processed, maxEngagement };
  }, [posts]);

  const getColor = (avg: number | null, max: number) => {
    if (avg === null || max === 0) return "bg-muted/30";
    
    const intensity = avg / max;
    
    if (intensity >= 0.8) return "bg-emerald-500";
    if (intensity >= 0.6) return "bg-emerald-400";
    if (intensity >= 0.4) return "bg-emerald-300";
    if (intensity >= 0.2) return "bg-emerald-200";
    return "bg-emerald-100";
  };

  const hasData = posts.some((p) => p.posted_at && p.engagement_rate !== null);

  if (!hasData) {
    return (
      <div className="p-6 rounded-xl bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">
          Nicht genügend Daten für die Heatmap
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Weniger</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-emerald-100" />
          <div className="w-4 h-4 rounded bg-emerald-200" />
          <div className="w-4 h-4 rounded bg-emerald-300" />
          <div className="w-4 h-4 rounded bg-emerald-400" />
          <div className="w-4 h-4 rounded bg-emerald-500" />
        </div>
        <span>Mehr Engagement</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-12" />
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex-1 text-center text-xs text-muted-foreground"
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Grid */}
          <TooltipProvider>
            <div className="space-y-1">
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center gap-1">
                  <div className="w-12 text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                  {heatmapData.grid[dayIndex].map((slot, hourIndex) => (
                    <Tooltip key={hourIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex-1 h-8 rounded cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                            getColor(slot.avg, heatmapData.maxEngagement)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium">
                            {DAYS_FULL[dayIndex]}, {HOURS[hourIndex]}:00 -{" "}
                            {HOURS[hourIndex] + 3}:00
                          </p>
                          {slot.avg !== null ? (
                            <>
                              <p className="text-emerald-500">
                                Ø {slot.avg.toFixed(2)}% Engagement
                              </p>
                              <p className="text-muted-foreground">
                                {slot.count} Post{slot.count !== 1 ? "s" : ""}
                              </p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">Keine Daten</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
