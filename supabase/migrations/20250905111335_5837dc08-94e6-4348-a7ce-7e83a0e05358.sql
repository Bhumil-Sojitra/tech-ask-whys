-- Create function to prevent self-voting
CREATE OR REPLACE FUNCTION public.prevent_self_voting()
RETURNS TRIGGER AS $$
DECLARE
  content_author_id UUID;
BEGIN
  -- Check if voting on a question
  IF NEW.question_id IS NOT NULL THEN
    SELECT author_id INTO content_author_id 
    FROM public.questions 
    WHERE id = NEW.question_id;
    
    IF content_author_id = NEW.user_id THEN
      RAISE EXCEPTION 'You cannot vote on your own question';
    END IF;
  END IF;
  
  -- Check if voting on an answer
  IF NEW.answer_id IS NOT NULL THEN
    SELECT author_id INTO content_author_id 
    FROM public.answers 
    WHERE id = NEW.answer_id;
    
    IF content_author_id = NEW.user_id THEN
      RAISE EXCEPTION 'You cannot vote on your own answer';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to prevent self-voting
CREATE TRIGGER prevent_self_voting_trigger
  BEFORE INSERT OR UPDATE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_voting();