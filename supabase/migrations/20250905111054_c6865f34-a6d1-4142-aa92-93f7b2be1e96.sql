-- Create user_views table to track unique views per user per question
CREATE TABLE public.user_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  question_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE public.user_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "User views are viewable by everyone" 
ON public.user_views 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert user views" 
ON public.user_views 
FOR INSERT 
WITH CHECK (true);