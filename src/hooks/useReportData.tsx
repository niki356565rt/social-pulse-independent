import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { generatePDFReport, generatePDFReportForEmail, getReportPeriod } from '@/lib/pdfReportGenerator';
import { toast } from 'sonner';

interface MetricRow {
  recorded_at: string;
  followers_count: number;
  engagement_rate: number | null;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  connected_accounts: {
    platform: string;
    username: string;
  };
}

export const useReportData = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { data: accounts } = useQuery({
    queryKey: ['connected-accounts-for-report', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('connected_accounts')
        .select('id, platform, username')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const fetchMetricsData = async (period: 'week' | 'month') => {
    if (!user || !accounts || accounts.length === 0) {
      return null;
    }

    const { startDate, endDate } = getReportPeriod(period);
    
    const { data: metricsData, error } = await supabase
      .from('social_metrics')
      .select(`
        recorded_at,
        followers_count,
        engagement_rate,
        likes_count,
        comments_count,
        views_count,
        connected_accounts!inner (
          platform,
          username
        )
      `)
      .in('account_id', accounts.map(a => a.id))
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;

    const accountsWithMetrics = accounts.map(account => {
      const accountMetrics = ((metricsData as unknown as MetricRow[]) || [])
        .filter(m => m.connected_accounts.platform === account.platform && m.connected_accounts.username === account.username)
        .map(m => ({
          date: m.recorded_at,
          followers: m.followers_count,
          engagement: m.engagement_rate || 0,
          likes: m.likes_count || 0,
          comments: m.comments_count || 0,
          views: m.views_count || 0,
        }));

      return {
        platform: account.platform,
        username: account.username,
        metrics: accountMetrics,
      };
    });

    return { accountsWithMetrics, startDate, endDate };
  };

  const generateReport = async (period: 'week' | 'month') => {
    if (!user || !accounts || accounts.length === 0) {
      toast.error('Keine verbundenen Accounts gefunden');
      return;
    }

    setIsGenerating(true);
    
    try {
      const data = await fetchMetricsData(period);
      if (!data) return;

      generatePDFReport({
        accounts: data.accountsWithMetrics,
        period,
        startDate: data.startDate,
        endDate: data.endDate,
      });

      toast.success(`${period === 'week' ? 'Wochen' : 'Monats'}bericht wurde erstellt!`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Fehler beim Erstellen des Reports');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendReportEmail = async (period: 'week' | 'month', email: string) => {
    if (!user || !accounts || accounts.length === 0) {
      toast.error('Keine verbundenen Accounts gefunden');
      return;
    }

    if (!email) {
      toast.error('Bitte gib eine E-Mail-Adresse ein');
      return;
    }

    setIsSendingEmail(true);
    
    try {
      const data = await fetchMetricsData(period);
      if (!data) return;

      const { filename, base64 } = generatePDFReportForEmail({
        accounts: data.accountsWithMetrics,
        period,
        startDate: data.startDate,
        endDate: data.endDate,
      });

      const { data: response, error } = await supabase.functions.invoke('send-report-email', {
        body: {
          recipientEmail: email,
          reportType: period,
          pdfBase64: base64,
          filename,
        },
      });

      if (error) throw error;

      toast.success(`Report wurde an ${email} gesendet!`);
    } catch (error: any) {
      console.error('Error sending report email:', error);
      toast.error(error.message || 'Fehler beim Senden der E-Mail');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const exportCSV = async () => {
    if (!user || !accounts || accounts.length === 0) {
      toast.error('Keine verbundenen Accounts gefunden');
      return;
    }

    try {
      const { data: metricsData, error } = await supabase
        .from('social_metrics')
        .select(`
          recorded_at,
          followers_count,
          following_count,
          posts_count,
          engagement_rate,
          likes_count,
          comments_count,
          views_count,
          connected_accounts!inner (
            platform,
            username
          )
        `)
        .in('account_id', accounts.map(a => a.id))
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      if (!metricsData || metricsData.length === 0) {
        toast.error('Keine Daten zum Exportieren');
        return;
      }

      const headers = ['Datum', 'Plattform', 'Username', 'Follower', 'Following', 'Posts', 'Likes', 'Kommentare', 'Views', 'Engagement Rate'];
      const rows = (metricsData as unknown as (MetricRow & { following_count: number | null; posts_count: number | null })[]).map(m => [
        new Date(m.recorded_at).toLocaleDateString('de-DE'),
        m.connected_accounts.platform,
        m.connected_accounts.username,
        m.followers_count,
        m.following_count || '',
        m.posts_count || '',
        m.likes_count || '',
        m.comments_count || '',
        m.views_count || '',
        m.engagement_rate ? `${m.engagement_rate.toFixed(2)}%` : '',
      ]);

      const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `social-media-daten-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('CSV-Export erfolgreich!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Fehler beim CSV-Export');
    }
  };

  return {
    accounts,
    isGenerating,
    isSendingEmail,
    generateReport,
    sendReportEmail,
    exportCSV,
  };
};
