import { Clock, TrendingUp, Calendar, Sparkles, Grid3X3 } from "lucide-react";
import { useBestPostingTimes } from "@/hooks/useBestPostingTimes";
import { Post } from "@/hooks/useTopPosts";
import { cn } from "@/lib/utils";
import { EngagementHeatmap } from "./EngagementHeatmap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BestPostingTimesWidgetProps {
  posts: Post[];
}

export function BestPostingTimesWidget({ posts }: BestPostingTimesWidgetProps) {
  const { bestTimes, bestDay, bestHour, hasEnoughData, getDayName, formatHour } = useBestPostingTimes(posts);

  if (!hasEnoughData) {
    return (
      <div className="kpi-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold">Beste Zeit zum Posten</h3>
            <p className="text-sm text-muted-foreground">Basierend auf deinem Engagement</p>
          </div>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Mindestens 5 Posts mit Zeitstempel nötig</p>
          <p className="text-xs mt-1">für eine aussagekräftige Analyse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kpi-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold">Beste Zeit zum Posten</h3>
          <p className="text-sm text-muted-foreground">Basierend auf deinem Engagement</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Heatmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Top Insights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Bester Tag</span>
              </div>
              <p className="text-xl font-bold">{bestDay || "-"}</p>
            </div>
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 text-accent mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Beste Uhrzeit</span>
              </div>
              <p className="text-xl font-bold">{bestHour !== null ? formatHour(bestHour) : "-"}</p>
            </div>
          </div>

          {/* Top 5 Best Times */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <h4 className="text-sm font-medium">Top 5 Posting-Zeiten</h4>
            </div>
            <div className="space-y-2">
              {bestTimes.map((slot, index) => (
                <div
                  key={`${slot.dayOfWeek}-${slot.hour}`}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    index === 0 
                      ? "bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30" 
                      : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
                    )}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">
                        {getDayName(slot.dayOfWeek)}, {formatHour(slot.hour)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {slot.postCount} Post{slot.postCount !== 1 ? "s" : ""} analysiert
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-emerald-500">
                    <TrendingUp className="w-4 h-4" />
                    {slot.avgEngagement.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="heatmap">
          <EngagementHeatmap posts={posts} />
        </TabsContent>
      </Tabs>

      {/* Tip */}
      <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-xs text-muted-foreground">
          💡 <span className="font-medium">Tipp:</span> Poste zu deinen Top-Zeiten für maximales Engagement. 
          Die Analyse basiert auf {posts.filter(p => p.posted_at).length} deiner Posts.
        </p>
      </div>
    </div>
  );
}
