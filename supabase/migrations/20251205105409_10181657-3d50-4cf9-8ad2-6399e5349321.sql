-- Create competitors table
CREATE TABLE public.competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  profile_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, username)
);

-- Create competitor metrics table
CREATE TABLE public.competitor_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER,
  posts_count INTEGER,
  engagement_rate NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitors
CREATE POLICY "Users can view their own competitors" 
ON public.competitors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitors" 
ON public.competitors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitors" 
ON public.competitors 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitors" 
ON public.competitors 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for competitor_metrics
CREATE POLICY "Users can view metrics for their competitors" 
ON public.competitor_metrics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.competitors c 
  WHERE c.id = competitor_metrics.competitor_id AND c.user_id = auth.uid()
));

CREATE POLICY "Users can insert metrics for their competitors" 
ON public.competitor_metrics 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.competitors c 
  WHERE c.id = competitor_metrics.competitor_id AND c.user_id = auth.uid()
));

-- Create index for faster queries
CREATE INDEX idx_competitors_user_id ON public.competitors(user_id);
CREATE INDEX idx_competitor_metrics_competitor_id ON public.competitor_metrics(competitor_id);
CREATE INDEX idx_competitor_metrics_recorded_at ON public.competitor_metrics(recorded_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_competitors_updated_at
BEFORE UPDATE ON public.competitors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();