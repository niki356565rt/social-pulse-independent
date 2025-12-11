import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Post {
  id: string;
  account_id: string;
  platform_post_id: string;
  content: string | null;
  media_url: string | null;
  posted_at: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  shares_count: number;
  engagement_rate: number | null;
  platform?: string;
  username?: string;
}

export function useTopPosts(selectedAccountId?: string) {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [worstPosts, setWorstPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user's connected accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("connected_accounts")
        .select("id, platform, username")
        .eq("user_id", user.id);

      if (accountsError) throw accountsError;
      if (!accounts || accounts.length === 0) {
        setAllPosts([]);
        setTopPosts([]);
        setWorstPosts([]);
        setLoading(false);
        return;
      }

      // Filter accounts basierend auf selectedAccountId
      let filteredAccountIds = accounts.map(a => a.id);
      if (selectedAccountId && selectedAccountId !== "all") {
        filteredAccountIds = filteredAccountIds.filter(id => id === selectedAccountId);
      }

      const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]));

      // Fetch all posts for user's accounts
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .in("account_id", filteredAccountIds)
        .order("engagement_rate", { ascending: false, nullsFirst: false });

      if (postsError) throw postsError;

      if (!posts || posts.length === 0) {
        setAllPosts([]);
        setTopPosts([]);
        setWorstPosts([]);
        setLoading(false);
        return;
      }

      // Enrich posts with platform info
      const enrichedPosts: Post[] = posts.map(post => ({
        ...post,
        platform: accountMap[post.account_id]?.platform,
        username: accountMap[post.account_id]?.username,
      }));

      // Set all posts and top/worst 3
      setAllPosts(enrichedPosts);
      setTopPosts(enrichedPosts.slice(0, 3));
      setWorstPosts(enrichedPosts.slice(-3).reverse());
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedAccountId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    allPosts,
    topPosts,
    worstPosts,
    loading,
    refetch: fetchPosts,
  };
}
