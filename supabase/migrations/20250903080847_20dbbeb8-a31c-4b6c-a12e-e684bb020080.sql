-- Fix the comments constraint to allow direct comments on questions and answers
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_must_have_parent;

-- Add a proper constraint that allows:
-- 1. Comments directly on questions (question_id set, answer_id and parent_comment_id null)
-- 2. Comments directly on answers (answer_id set, question_id and parent_comment_id null) 
-- 3. Replies to comments (parent_comment_id set, question_id and answer_id null)
ALTER TABLE public.comments 
ADD CONSTRAINT comments_target_parent_check 
CHECK (
  (question_id IS NOT NULL AND answer_id IS NULL AND parent_comment_id IS NULL) OR
  (answer_id IS NOT NULL AND question_id IS NULL AND parent_comment_id IS NULL) OR  
  (parent_comment_id IS NOT NULL AND question_id IS NULL AND answer_id IS NULL)
);