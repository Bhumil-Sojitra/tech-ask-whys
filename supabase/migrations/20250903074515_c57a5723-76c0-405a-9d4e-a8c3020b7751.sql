-- Add missing foreign key constraints and fix column references for comments table

-- First, let's add the missing question_id column to comments table if it doesn't exist
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS question_id UUID;

-- Add foreign key constraints
ALTER TABLE public.comments 
ADD CONSTRAINT comments_question_id_fkey 
FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_answer_id_fkey 
FOREIGN KEY (answer_id) REFERENCES public.answers(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add constraints to ensure a comment belongs to either a question or an answer, but not both
ALTER TABLE public.comments 
ADD CONSTRAINT comments_target_check 
CHECK (
  (question_id IS NOT NULL AND answer_id IS NULL) OR 
  (question_id IS NULL AND answer_id IS NOT NULL)
);