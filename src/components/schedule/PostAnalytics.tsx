import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScheduledPost } from '@/hooks/useScheduledPosts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Clock, TrendingUp, Calendar, Sparkles, Instagram, 
  Hash, Copy, Check, Target, Tag, 
  Eye, Heart, MessageCircle, Share2, Bookmark, Users, BarChart3, RefreshCw, Youtube
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// --- BEST TIME TO POST COMPONENT ---

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

export const BestTimeToPost = ({ platform }: { platform?: 'instagram' | 'tiktok' | 'youtube' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const { data: posts, error } = await supabase
          .from('posts')
          .select(`
            id, posted_at, likes_count, comments_count, views_count, engagement_rate,
            connected_accounts!inner(platform)
          `)
          .not('posted_at', 'is', null);

        if (error) throw error;

        const filteredPosts = platform 
          ? posts?.filter((p: any) => p.connected_accounts?.platform === platform)
          : posts;

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
      return [
        { day: 'Montag', dayIndex: 1, times: [{ hour: 12, score: 85 }, { hour: 18, score: 90 }] },
        { day: 'Mittwoch', dayIndex: 3, times: [{ hour: 11, score: 88 }, { hour: 19, score: 92 }] },
        { day: 'Freitag', dayIndex: 5, times: [{ hour: 10, score: 82 }, { hour: 17, score: 87 }] },
        { day: 'Samstag', dayIndex: 6, times: [{ hour: 11, score: 80 }, { hour: 20, score: 85 }] },
      ];
    }

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
    const grid: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    timeSlots.forEach(slot => { grid[slot.day][slot.hour] = slot.engagement; });
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

  if (loading) return <Card><CardContent className="pt-6"><Skeleton className="h-40" /></CardContent></Card>;

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
              {timeSlots.length > 0 ? 'Basierend auf deiner Performance' : 'Allgemeine Empfehlungen'}
            </CardDescription>
          </div>
          {platform && (
            <Badge variant="secondary">
              {platform === 'instagram' ? <><Instagram className="w-3 h-3 mr-1" /> Instagram</> : 
               platform === 'tiktok' ? <><TikTokIcon className="w-3 h-3 mr-1" /> TikTok</> :
               <><Youtube className="w-3 h-3 mr-1" /> YouTube</>}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" /> Top Empfehlungen
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recommendations.map((rec, i) => (
              <div key={rec.dayIndex} className={cn('p-3 rounded-lg border', i === 0 ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-border')}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{rec.day}</span>
                </div>
                <div className="space-y-1">
                  {rec.times.map((time, j) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{formatHour(time.hour)}</span>
                      <Badge variant={time.score >= 85 ? 'default' : 'secondary'} className="text-[10px] px-1.5">
                        {time.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {timeSlots.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Engagement-Heatmap</h4>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex mb-1 ml-8">
                  {[0, 6, 12, 18].map(h => <div key={h} className="flex-1 text-xs text-muted-foreground text-center">{formatHour(h)}</div>)}
                </div>
                {DAYS_SHORT.map((day, dayIndex) => (
                  <div key={day} className="flex items-center gap-1 mb-1">
                    <span className="w-6 text-xs text-muted-foreground">{day}</span>
                    <div className="flex-1 flex gap-0.5">
                      {heatmapData[dayIndex].map((val, hour) => (
                        <div key={hour} className={cn('flex-1 h-4 rounded-sm', val === 0 ? 'bg-muted' : val < 0.5 ? 'bg-primary/40' : 'bg-primary')} title={`${DAYS[dayIndex]} ${hour}h: ${Math.round(val*100)}%`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- HASHTAG SUGGESTIONS COMPONENT ---

interface Hashtag { tag: string; category: 'trending' | 'niche' | 'general' | 'branded'; popularity: 'high' | 'medium' | 'low'; }
interface HashtagSuggestionsProps { content: string; platform: 'instagram' | 'tiktok'; onSelect: (hashtags: string[]) => void; selectedHashtags: string[]; }

export const HashtagSuggestions = ({ content, platform, onSelect, selectedHashtags }: HashtagSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSuggestions = async () => {
    if (!content.trim()) { toast.error('Bitte gib zuerst einen Caption-Text ein'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-hashtags', {
        body: { content, platform, language: 'de' }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setSuggestions(data.hashtags || []);
      if (data.hashtags?.length === 0) toast.info('Keine Hashtags generiert.');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Fehler beim Generieren: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = selectedHashtags.map(h => `#${h}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /> Hashtag-Vorschläge</CardTitle>
          <Button variant="outline" size="sm" onClick={generateSuggestions} disabled={loading || !content.trim()}>
            {loading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />} KI Vorschläge
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => onSelect(suggestions.map(s => s.tag))}>Alle auswählen</Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{selectedHashtags.length} gewählt</span>
                {selectedHashtags.length > 0 && <Button variant="outline" size="sm" onClick={copyToClipboard}>{copied ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}</Button>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(h => (
                <Badge 
                  key={h.tag} 
                  variant={selectedHashtags.includes(h.tag) ? 'default' : 'outline'}
                  className={cn('cursor-pointer hover:scale-105', selectedHashtags.includes(h.tag) && 'bg-primary')}
                  onClick={() => {
                    if (selectedHashtags.includes(h.tag)) onSelect(selectedHashtags.filter(t => t !== h.tag));
                    else onSelect([...selectedHashtags, h.tag]);
                  }}
                >
                  #{h.tag}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground"><p>Klicke auf "KI Vorschläge" um zu starten</p></div>
        )}
      </CardContent>
    </Card>
  );
};

// --- ANALYTICS OVERVIEW & POST ANALYTICS CARD ---

interface PostAnalytics {
  id: string;
  scheduled_post_id: string;
  platform: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  reach: number;
  engagement_rate: number | null;
  recorded_at: string;
}

interface PostAnalyticsProps {
  post: ScheduledPost;
}

export const PostAnalyticsCard = ({ post }: PostAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<PostAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('post_analytics')
        .select('*')
        .eq('scheduled_post_id', post.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setAnalytics(data as PostAnalytics | null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (post.status === 'published') {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [post.id, post.status]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics aktualisiert');
  };

  if (post.status !== 'published') {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-8 text-center">
          <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Analytics verfügbar nach Veröffentlichung</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <Card><CardContent><Skeleton className="h-32" /></CardContent></Card>;

  const PlatformIcon = post.platform === 'tiktok' ? TikTokIcon : post.platform === 'youtube' ? Youtube : Instagram;

  const stats = [
    { label: 'Aufrufe', value: analytics?.views_count || 0, icon: Eye },
    { label: 'Likes', value: analytics?.likes_count || 0, icon: Heart },
    { label: 'Kommentare', value: analytics?.comments_count || 0, icon: MessageCircle },
    { label: 'Shares', value: analytics?.shares_count || 0, icon: Share2 },
    { label: 'Reichweite', value: analytics?.reach || 0, icon: Users },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><PlatformIcon className="w-4 h-4" /> Post Analytics</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Aktualisieren
          </Button>
        </div>
        {analytics && <p className="text-xs text-muted-foreground">Zuletzt aktualisiert: {format(new Date(analytics.recorded_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>}
      </CardHeader>
      <CardContent>
        {!analytics ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Noch keine Analytics verfügbar</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>Analytics abrufen</Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                <stat.icon className="w-4 h-4 text-muted-foreground mb-1" />
                <span className="text-lg font-bold">{formatNumber(stat.value)}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AnalyticsOverview = ({ posts }: { posts: ScheduledPost[] }) => {
  const [analytics, setAnalytics] = useState<PostAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const publishedPosts = posts.filter(p => p.status === 'published');

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      if (publishedPosts.length === 0) { setLoading(false); return; }
      try {
        const { data, error } = await supabase.from('post_analytics').select('*').in('scheduled_post_id', publishedPosts.map(p => p.id)).order('recorded_at', { ascending: false });
        if (error) throw error;
        setAnalytics((data as PostAnalytics[]) || []);
      } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    };
    fetchAllAnalytics();
  }, [posts]);

  if (loading) return <Skeleton className="h-32" />;
  if (publishedPosts.length === 0) return null;

  const totalViews = analytics.reduce((acc, a) => acc + (a.views_count || 0), 0);
  const totalLikes = analytics.reduce((acc, a) => acc + (a.likes_count || 0), 0);
  const totalComments = analytics.reduce((acc, a) => acc + (a.comments_count || 0), 0);
  const avgEngagement = analytics.length > 0 ? analytics.reduce((acc, a) => acc + (a.engagement_rate || 0), 0) / analytics.length : 0;

  const formatNumber = (num: number) => num >= 1000000 ? `${(num / 1000000).toFixed(1)}M` : num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toString();

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Gesamt-Performance</CardTitle>
        <p className="text-xs text-muted-foreground">{publishedPosts.length} veröffentlichte Posts</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center"><div className="text-2xl font-bold">{formatNumber(totalViews)}</div><div className="text-xs text-muted-foreground flex justify-center gap-1"><Eye className="w-3 h-3" /> Aufrufe</div></div>
          <div className="text-center"><div className="text-2xl font-bold">{formatNumber(totalLikes)}</div><div className="text-xs text-muted-foreground flex justify-center gap-1"><Heart className="w-3 h-3" /> Likes</div></div>
          <div className="text-center"><div className="text-2xl font-bold">{formatNumber(totalComments)}</div><div className="text-xs text-muted-foreground flex justify-center gap-1"><MessageCircle className="w-3 h-3" /> Kommentare</div></div>
          <div className="text-center"><div className="text-2xl font-bold">{avgEngagement.toFixed(2)}%</div><div className="text-xs text-muted-foreground flex justify-center gap-1"><TrendingUp className="w-3 h-3" /> Ø Engagement</div></div>
        </div>
      </CardContent>
    </Card>
  );
};