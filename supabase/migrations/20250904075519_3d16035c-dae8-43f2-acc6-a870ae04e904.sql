-- Remove the faulty constraint that prevents commenting on questions
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_must_have_parent;