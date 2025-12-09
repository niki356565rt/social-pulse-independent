import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ContentTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  platform: string;
  content: string | null;
  media_type: string;
  hashtags: string[];
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostDraft {
  id: string;
  user_id: string;
  account_id: string | null;
  platform: string | null;
  content: string | null;
  media_urls: string[];
  media_type: string;
  hashtags: string[];
  template_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useContentPlanner = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates((data as ContentTemplate[]) || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, [user]);

  const fetchDrafts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('post_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts((data as PostDraft[]) || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTemplates(), fetchDrafts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchTemplates, fetchDrafts]);

  // Template CRUD
  const createTemplate = async (template: Omit<ContentTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('content_templates')
        .insert({ ...template, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      toast.success('Vorlage erstellt');
      await fetchTemplates();
      return data as ContentTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Fehler beim Erstellen der Vorlage');
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<ContentTemplate>) => {
    try {
      const { error } = await supabase
        .from('content_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Vorlage aktualisiert');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Fehler beim Aktualisieren');
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Vorlage gelöscht');
      await fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Fehler beim Löschen');
      return false;
    }
  };

  // Draft CRUD
  const createDraft = async (draft: Omit<PostDraft, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      // Clean up empty strings to null for nullable fields
      const cleanedDraft = {
        ...draft,
        user_id: user.id,
        account_id: draft.account_id || null,
        platform: draft.platform || null,
        template_id: draft.template_id || null,
        content: draft.content || null,
        notes: draft.notes || null,
      };

      const { data, error } = await supabase
        .from('post_drafts')
        .insert(cleanedDraft)
        .select()
        .single();

      if (error) throw error;
      toast.success('Entwurf gespeichert');
      await fetchDrafts();
      return data as PostDraft;
    } catch (error) {
      console.error('Error creating draft:', error);
      toast.error('Fehler beim Speichern des Entwurfs');
      return null;
    }
  };

  const updateDraft = async (id: string, updates: Partial<PostDraft>) => {
    try {
      const { error } = await supabase
        .from('post_drafts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Entwurf aktualisiert');
      await fetchDrafts();
      return true;
    } catch (error) {
      console.error('Error updating draft:', error);
      toast.error('Fehler beim Aktualisieren');
      return false;
    }
  };

  const deleteDraft = async (id: string) => {
    try {
      const { error } = await supabase
        .from('post_drafts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Entwurf gelöscht');
      await fetchDrafts();
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Fehler beim Löschen');
      return false;
    }
  };

  return {
    templates,
    drafts,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createDraft,
    updateDraft,
    deleteDraft,
    refetch: () => Promise.all([fetchTemplates(), fetchDrafts()]),
  };
};
