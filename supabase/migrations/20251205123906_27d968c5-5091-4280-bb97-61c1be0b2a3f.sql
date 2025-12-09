-- Create content_templates table for reusable post templates
CREATE TABLE IF NOT EXISTS public.content_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  platform text NOT NULL,
  content text,
  media_type text DEFAULT 'image',
  hashtags text[],
  category text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_templates
CREATE POLICY "Users can view their own templates"
ON public.content_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
ON public.content_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.content_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.content_templates FOR DELETE
USING (auth.uid() = user_id);

-- Create post_drafts table for saving draft posts
CREATE TABLE IF NOT EXISTS public.post_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid REFERENCES public.connected_accounts(id) ON DELETE SET NULL,
  platform text,
  content text,
  media_urls text[] DEFAULT '{}',
  media_type text DEFAULT 'image',
  hashtags text[],
  template_id uuid REFERENCES public.content_templates(id) ON DELETE SET NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_drafts
CREATE POLICY "Users can view their own drafts"
ON public.post_drafts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
ON public.post_drafts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
ON public.post_drafts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
ON public.post_drafts FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_templates_user ON public.content_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_post_drafts_user ON public.post_drafts(user_id);