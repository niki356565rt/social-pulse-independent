import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ScheduledPost {
  id: string;
  user_id: string;
  account_id: string;
  platform: 'instagram' | 'youtube' | 'tiktok';
  content: string | null;
  media_urls: string[];
  media_type: 'image' | 'video' | 'carousel' | 'reels';
  scheduled_for: string;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  platform_post_id: string | null;
  error_message: string | null;
  created_at: string;
  published_at: string | null;
}

export const useScheduledPosts = () => {
  const { user, session } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setPosts((data as ScheduledPost[]) || []);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (postData: {
    account_id: string;
    platform: 'instagram' | 'youtube' | 'tiktok';
    content?: string;
    media_urls: string[];
    media_type: 'image' | 'video' | 'carousel' | 'reels';
    scheduled_for: string;
    is_recurring?: boolean;
    recurrence_pattern?: string;
    recurrence_end_date?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          account_id: postData.account_id,
          platform: postData.platform,
          content: postData.content,
          media_urls: postData.media_urls,
          media_type: postData.media_type,
          scheduled_for: postData.scheduled_for,
          is_recurring: postData.is_recurring || false,
          recurrence_pattern: postData.recurrence_pattern || null,
          recurrence_end_date: postData.recurrence_end_date || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(postData.is_recurring ? 'Post-Serie geplant' : 'Post geplant');
      await fetchPosts();
      return data as ScheduledPost;
    } catch (error: any) {
      console.error('Error creating scheduled post:', error);
      toast.error('Fehler beim Planen des Posts');
      return null;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post gelöscht');
      await fetchPosts();
      return true;
    } catch (error) {
      console.error('Error deleting scheduled post:', error);
      toast.error('Fehler beim Löschen');
      return false;
    }
  };

  const updatePost = async (postId: string, updates: Partial<Pick<ScheduledPost, 'scheduled_for' | 'content' | 'media_urls'>>) => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post aktualisiert');
      await fetchPosts();
      return true;
    } catch (error) {
      console.error('Error updating scheduled post:', error);
      toast.error('Fehler beim Aktualisieren');
      return false;
    }
  };

  const publishNow = async (postId: string) => {
    if (!session?.access_token) return false;

    // Find the post to determine which function to call
    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    const functionName = post.platform === 'tiktok' ? 'publish-tiktok' : 'publish-instagram';

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { postId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Post veröffentlicht');
        await fetchPosts();
        return true;
      } else {
        toast.error(data.error || 'Fehler beim Veröffentlichen');
        await fetchPosts();
        return false;
      }
    } catch (error: any) {
      console.error('Error publishing post:', error);
      toast.error('Fehler beim Veröffentlichen');
      return false;
    }
  };

  return {
    posts,
    loading,
    createPost,
    updatePost,
    deletePost,
    publishNow,
    refetch: fetchPosts,
  };
};
