-- Update comments table structure, avoiding duplicate constraints

-- Drop existing constraint if it exists and recreate to ensure correct structure
DO $$ 
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_target_check' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE public.comments DROP CONSTRAINT comments_target_check;
    END IF;
END $$;

-- Ensure question_id column exists (it should from previous migration)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS question_id UUID;

-- Add the constraint to ensure a comment belongs to either a question or an answer, but not both
ALTER TABLE public.comments 
ADD CONSTRAINT comments_target_check 
CHECK (
  (question_id IS NOT NULL AND answer_id IS NULL) OR 
  (question_id IS NULL AND answer_id IS NOT NULL)
);