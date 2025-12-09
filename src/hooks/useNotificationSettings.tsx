import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface NotificationSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  threshold_percent: number;
}

export function useNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (emailNotifications: boolean, thresholdPercent: number) => {
    if (!user) return;

    setSaving(true);
    try {
      if (settings) {
        // Update existing
        const { error } = await supabase
          .from('notification_settings')
          .update({
            email_notifications: emailNotifications,
            threshold_percent: thresholdPercent,
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('notification_settings')
          .insert({
            user_id: user.id,
            email_notifications: emailNotifications,
            threshold_percent: thresholdPercent,
          });

        if (error) throw error;
      }

      toast.success('Benachrichtigungseinstellungen gespeichert');
      await fetchSettings();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    saveSettings,
    refetch: fetchSettings,
  };
}