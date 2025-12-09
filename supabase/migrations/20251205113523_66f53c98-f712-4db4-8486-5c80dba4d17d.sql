-- Create scheduled posts table
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'youtube', 'tiktok')),
  content TEXT,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'carousel', 'reels')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed')),
  platform_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scheduled posts"
ON public.scheduled_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled posts"
ON public.scheduled_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts"
ON public.scheduled_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled posts"
ON public.scheduled_posts FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_scheduled_posts_updated_at
BEFORE UPDATE ON public.scheduled_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();