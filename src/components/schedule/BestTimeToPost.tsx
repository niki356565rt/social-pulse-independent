import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, TrendingUp, Calendar, Sparkles, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';

// TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface TimeSlot {
  day: number;
  hour: number;
  engagement: number;
  postCount: number;
}

interface BestTimeRecommendation {
  day: string;
  dayIndex: number;
  times: { hour: number; score: number }[];
}

const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const DAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export const BestTimeToPost = ({ platform }: { platform?: 'instagram' | 'tiktok' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch posts with their performance data
        const { data: posts, error } = await supabase
          .from('posts')
          .select(`
            id,
            posted_at,
            likes_count,
            comments_count,
            views_count,
            engagement_rate,
            account_id,
            connected_accounts!inner(platform)
          `)
          .not('posted_at', 'is', null);

        if (error) throw error;

        // Filter by platform if specified
        const filteredPosts = platform 
          ? posts?.filter((p: any) => p.connected_accounts?.platform === platform)
          : posts;

        // Aggregate by day and hour
        const slots: Record<string, TimeSlot> = {};

        filteredPosts?.forEach((post: any) => {
          if (!post.posted_at) return;
          const date = new Date(post.posted_at);
          const day = date.getDay();
          const hour = date.getHours();
          const key = `${day}-${hour}`;

          if (!slots[key]) {
            slots[key] = { day, hour, engagement: 0, postCount: 0 };
          }

          const engagement = (post.engagement_rate || 0) + 
            ((post.likes_count || 0) + (post.comments_count || 0) * 2) / Math.max(post.views_count || 1, 1) * 100;
          
          slots[key].engagement += engagement;
          slots[key].postCount += 1;
        });

        // Calculate average engagement per slot
        const slotsArray = Object.values(slots).map(slot => ({
          ...slot,
          engagement: slot.postCount > 0 ? slot.engagement / slot.postCount : 0
        }));

        setTimeSlots(slotsArray);
      } catch (error) {
        console.error('Error fetching time data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, platform]);

  const recommendations = useMemo((): BestTimeRecommendation[] => {
    if (timeSlots.length === 0) {
      // Default recommendations if no data
      return [
        { day: 'Montag', dayIndex: 1, times: [{ hour: 12, score: 85 }, { hour: 18, score: 90 }] },
        { day: 'Mittwoch', dayIndex: 3, times: [{ hour: 11, score: 88 }, { hour: 19, score: 92 }] },
        { day: 'Freitag', dayIndex: 5, times: [{ hour: 10, score: 82 }, { hour: 17, score: 87 }] },
        { day: 'Samstag', dayIndex: 6, times: [{ hour: 11, score: 80 }, { hour: 20, score: 85 }] },
      ];
    }

    // Group by day and find top times
    const byDay: Record<number, TimeSlot[]> = {};
    timeSlots.forEach(slot => {
      if (!byDay[slot.day]) byDay[slot.day] = [];
      byDay[slot.day].push(slot);
    });

    const recs: BestTimeRecommendation[] = [];
    
    Object.entries(byDay).forEach(([dayStr, slots]) => {
      const day = parseInt(dayStr);
      const sortedSlots = slots.sort((a, b) => b.engagement - a.engagement);
      const topSlots = sortedSlots.slice(0, 2);
      
      if (topSlots.length > 0) {
        const maxEngagement = Math.max(...slots.map(s => s.engagement));
        recs.push({
          day: DAYS[day],
          dayIndex: day,
          times: topSlots.map(s => ({
            hour: s.hour,
            score: maxEngagement > 0 ? Math.round((s.engagement / maxEngagement) * 100) : 50
          }))
        });
      }
    });

    return recs.sort((a, b) => {
      const maxA = Math.max(...a.times.map(t => t.score));
      const maxB = Math.max(...b.times.map(t => t.score));
      return maxB - maxA;
    }).slice(0, 4);
  }, [timeSlots]);

  const heatmapData = useMemo(() => {
    // Create 7x24 grid
    const grid: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    
    timeSlots.forEach(slot => {
      grid[slot.day][slot.hour] = slot.engagement;
    });

    // Normalize
    const maxVal = Math.max(...grid.flat());
    if (maxVal > 0) {
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          grid[d][h] = grid[d][h] / maxVal;
        }
      }
    }

    return grid;
  }, [timeSlots]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Beste Posting-Zeiten
            </CardTitle>
            <CardDescription>
              {timeSlots.length > 0 
                ? 'Basierend auf deinen bisherigen Post-Performance-Daten'
                : 'Allgemeine Empfehlungen für optimale Reichweite'}
            </CardDescription>
          </div>
          {platform && (
            <Badge variant="secondary">
              {platform === 'instagram' ? (
                <><Instagram className="w-3 h-3 mr-1" /> Instagram</>
              ) : (
                <><TikTokIcon className="w-3 h-3 mr-1" /> TikTok</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Recommendations */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Top Empfehlungen
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recommendations.map((rec, i) => (
              <div 
                key={rec.dayIndex}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  i === 0 ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-border'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{rec.day}</span>
                </div>
                <div className="space-y-1">
                  {rec.times.map((time, j) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{formatHour(time.hour)}</span>
                      <Badge 
                        variant={time.score >= 85 ? 'default' : 'secondary'} 
                        className={cn(
                          'text-xs px-1.5',
                          time.score >= 85 && 'bg-green-500'
                        )}
                      >
                        <TrendingUp className="w-2 h-2 mr-0.5" />
                        {time.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        {timeSlots.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Engagement-Heatmap</h4>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Hour labels */}
                <div className="flex mb-1 ml-8">
                  {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
                    <div key={h} className="flex-1 text-xs text-muted-foreground text-center">
                      {formatHour(h)}
                    </div>
                  ))}
                </div>
                
                {/* Grid */}
                {DAYS_SHORT.map((day, dayIndex) => (
                  <div key={day} className="flex items-center gap-1 mb-1">
                    <span className="w-6 text-xs text-muted-foreground">{day}</span>
                    <div className="flex-1 flex gap-0.5">
                      {heatmapData[dayIndex].map((val, hour) => (
                        <div
                          key={hour}
                          className={cn(
                            'flex-1 h-4 rounded-sm transition-colors',
                            val === 0 ? 'bg-muted' :
                            val < 0.25 ? 'bg-primary/20' :
                            val < 0.5 ? 'bg-primary/40' :
                            val < 0.75 ? 'bg-primary/60' :
                            'bg-primary'
                          )}
                          title={`${DAYS[dayIndex]} ${formatHour(hour)}: ${Math.round(val * 100)}%`}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
                  <span>Weniger</span>
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-muted" />
                    <div className="w-3 h-3 rounded-sm bg-primary/20" />
                    <div className="w-3 h-3 rounded-sm bg-primary/40" />
                    <div className="w-3 h-3 rounded-sm bg-primary/60" />
                    <div className="w-3 h-3 rounded-sm bg-primary" />
                  </div>
                  <span>Mehr</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
