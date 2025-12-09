-- Table for connected social media accounts
CREATE TABLE public.connected_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  platform_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Table for social media metrics history
CREATE TABLE public.social_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER,
  posts_count INTEGER,
  likes_count INTEGER,
  comments_count INTEGER,
  views_count INTEGER,
  engagement_rate DECIMAL(5,2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for connected_accounts
CREATE POLICY "Users can view their own connected accounts"
ON public.connected_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connected accounts"
ON public.connected_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected accounts"
ON public.connected_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected accounts"
ON public.connected_accounts FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for social_metrics (via account ownership)
CREATE POLICY "Users can view metrics of their own accounts"
ON public.social_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.connected_accounts ca
    WHERE ca.id = account_id AND ca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert metrics for their own accounts"
ON public.social_metrics FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.connected_accounts ca
    WHERE ca.id = account_id AND ca.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_connected_accounts_updated_at
BEFORE UPDATE ON public.connected_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_social_metrics_account_recorded ON public.social_metrics(account_id, recorded_at DESC);
CREATE INDEX idx_connected_accounts_user ON public.connected_accounts(user_id);