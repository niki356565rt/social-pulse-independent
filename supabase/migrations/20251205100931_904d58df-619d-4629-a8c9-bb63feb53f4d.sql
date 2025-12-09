-- Create posts table to track individual post performance
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
  platform_post_id TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_id, platform_post_id)
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view posts from their own accounts"
ON public.posts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM connected_accounts ca
  WHERE ca.id = posts.account_id AND ca.user_id = auth.uid()
));

CREATE POLICY "Users can insert posts for their own accounts"
ON public.posts FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM connected_accounts ca
  WHERE ca.id = posts.account_id AND ca.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();