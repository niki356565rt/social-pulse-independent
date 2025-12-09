import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Competitor {
  id: string;
  user_id: string;
  platform: string;
  username: string;
  display_name: string | null;
  profile_url: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitorMetrics {
  id: string;
  competitor_id: string;
  followers_count: number;
  following_count: number | null;
  posts_count: number | null;
  engagement_rate: number | null;
  recorded_at: string;
}

export interface CompetitorWithMetrics extends Competitor {
  latestMetrics: CompetitorMetrics | null;
  metricsHistory: CompetitorMetrics[];
}

export const useCompetitors = () => {
  const { user } = useAuth();
  const [competitors, setCompetitors] = useState<CompetitorWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompetitors = useCallback(async () => {
    if (!user) {
      setCompetitors([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch competitors
      const { data: competitorsData, error: competitorsError } = await supabase
        .from('competitors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (competitorsError) throw competitorsError;

      if (!competitorsData || competitorsData.length === 0) {
        setCompetitors([]);
        setLoading(false);
        return;
      }

      // Fetch metrics for all competitors
      const competitorIds = competitorsData.map(c => c.id);
      const { data: metricsData, error: metricsError } = await supabase
        .from('competitor_metrics')
        .select('*')
        .in('competitor_id', competitorIds)
        .order('recorded_at', { ascending: false });

      if (metricsError) throw metricsError;

      // Combine data
      const competitorsWithMetrics: CompetitorWithMetrics[] = competitorsData.map(competitor => {
        const competitorMetrics = (metricsData || []).filter(m => m.competitor_id === competitor.id);
        return {
          ...competitor,
          latestMetrics: competitorMetrics[0] || null,
          metricsHistory: competitorMetrics,
        };
      });

      setCompetitors(competitorsWithMetrics);
    } catch (error) {
      console.error('Error fetching competitors:', error);
      toast.error('Fehler beim Laden der Konkurrenten');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const addCompetitor = async (platform: string, username: string, displayName?: string) => {
    if (!user) {
      toast.error('Bitte melde dich an');
      return false;
    }

    try {
      const profileUrl = getProfileUrl(platform, username);
      
      const { data, error } = await supabase
        .from('competitors')
        .insert({
          user_id: user.id,
          platform,
          username: username.replace('@', ''),
          display_name: displayName || username,
          profile_url: profileUrl,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Dieser Konkurrent wurde bereits hinzugefügt');
        } else {
          throw error;
        }
        return false;
      }

      // Add initial metrics (placeholder - in real app would fetch from API)
      await supabase
        .from('competitor_metrics')
        .insert({
          competitor_id: data.id,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
        });

      toast.success('Konkurrent hinzugefügt');
      fetchCompetitors();
      return true;
    } catch (error) {
      console.error('Error adding competitor:', error);
      toast.error('Fehler beim Hinzufügen des Konkurrenten');
      return false;
    }
  };

  const removeCompetitor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('competitors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Konkurrent entfernt');
      setCompetitors(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error removing competitor:', error);
      toast.error('Fehler beim Entfernen des Konkurrenten');
    }
  };

  const updateMetrics = async (competitorId: string, metrics: Partial<CompetitorMetrics>) => {
    try {
      const { error } = await supabase
        .from('competitor_metrics')
        .insert({
          competitor_id: competitorId,
          followers_count: metrics.followers_count || 0,
          following_count: metrics.following_count,
          posts_count: metrics.posts_count,
          engagement_rate: metrics.engagement_rate,
        });

      if (error) throw error;
      fetchCompetitors();
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  };

  return {
    competitors,
    loading,
    addCompetitor,
    removeCompetitor,
    updateMetrics,
    refetch: fetchCompetitors,
  };
};

function getProfileUrl(platform: string, username: string): string {
  const cleanUsername = username.replace('@', '');
  switch (platform.toLowerCase()) {
    case 'instagram':
      return `https://instagram.com/${cleanUsername}`;
    case 'tiktok':
      return `https://tiktok.com/@${cleanUsername}`;
    case 'youtube':
      return `https://youtube.com/@${cleanUsername}`;
    default:
      return '';
  }
}
