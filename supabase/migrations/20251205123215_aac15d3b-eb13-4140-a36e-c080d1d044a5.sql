-- Add recurrence fields to scheduled_posts
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern text, -- 'daily', 'weekly', 'monthly'
ADD COLUMN IF NOT EXISTS recurrence_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS parent_post_id uuid REFERENCES public.scheduled_posts(id) ON DELETE SET NULL;

-- Create post_analytics table for tracking published post performance
CREATE TABLE IF NOT EXISTS public.post_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id uuid REFERENCES public.scheduled_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  platform_post_id text,
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  saves_count integer DEFAULT 0,
  reach integer DEFAULT 0,
  engagement_rate numeric,
  recorded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_analytics
CREATE POLICY "Users can view their own post analytics"
ON public.post_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post analytics"
ON public.post_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post analytics"
ON public.post_analytics FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_post_analytics_scheduled_post ON public.post_analytics(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_user ON public.post_analytics(user_id);