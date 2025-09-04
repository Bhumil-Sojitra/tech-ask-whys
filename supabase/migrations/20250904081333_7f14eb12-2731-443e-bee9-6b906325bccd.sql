-- Add unique constraint for user_preferences to enable upsert
ALTER TABLE public.user_preferences
ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);

-- Create reputation calculation functions and triggers
CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  target_author_id UUID;
  reputation_change INTEGER;
BEGIN
  -- Determine the target author and reputation change
  IF NEW.question_id IS NOT NULL THEN
    SELECT author_id INTO target_author_id FROM questions WHERE id = NEW.question_id;
    reputation_change = CASE WHEN NEW.is_upvote THEN 5 ELSE -2 END;
  ELSIF NEW.answer_id IS NOT NULL THEN
    SELECT author_id INTO target_author_id FROM answers WHERE id = NEW.answer_id;
    reputation_change = CASE WHEN NEW.is_upvote THEN 10 ELSE -2 END;
  END IF;

  -- Update the user's reputation
  IF target_author_id IS NOT NULL THEN
    UPDATE profiles 
    SET reputation = GREATEST(1, reputation + reputation_change)
    WHERE user_id = target_author_id;
    
    -- Log reputation history
    INSERT INTO reputation_history (
      user_id,
      points,
      reason,
      question_id,
      answer_id
    ) VALUES (
      target_author_id,
      reputation_change,
      CASE 
        WHEN NEW.question_id IS NOT NULL THEN 
          CASE WHEN NEW.is_upvote THEN 'Question upvoted' ELSE 'Question downvoted' END
        ELSE 
          CASE WHEN NEW.is_upvote THEN 'Answer upvoted' ELSE 'Answer downvoted' END
      END,
      NEW.question_id,
      NEW.answer_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle reputation changes when votes are updated
CREATE OR REPLACE FUNCTION handle_vote_update()
RETURNS TRIGGER AS $$
DECLARE
  target_author_id UUID;
  old_reputation_change INTEGER;
  new_reputation_change INTEGER;
BEGIN
  -- Determine the target author
  IF OLD.question_id IS NOT NULL THEN
    SELECT author_id INTO target_author_id FROM questions WHERE id = OLD.question_id;
    old_reputation_change = CASE WHEN OLD.is_upvote THEN 5 ELSE -2 END;
    new_reputation_change = CASE WHEN NEW.is_upvote THEN 5 ELSE -2 END;
  ELSIF OLD.answer_id IS NOT NULL THEN
    SELECT author_id INTO target_author_id FROM answers WHERE id = OLD.answer_id;
    old_reputation_change = CASE WHEN OLD.is_upvote THEN 10 ELSE -2 END;
    new_reputation_change = CASE WHEN NEW.is_upvote THEN 10 ELSE -2 END;
  END IF;

  -- Apply the reputation change
  IF target_author_id IS NOT NULL THEN
    UPDATE profiles 
    SET reputation = GREATEST(1, reputation - old_reputation_change + new_reputation_change)
    WHERE user_id = target_author_id;
    
    -- Log reputation history
    INSERT INTO reputation_history (
      user_id,
      points,
      reason,
      question_id,
      answer_id
    ) VALUES (
      target_author_id,
      new_reputation_change - old_reputation_change,
      CASE 
        WHEN NEW.question_id IS NOT NULL THEN 'Question vote changed'
        ELSE 'Answer vote changed'
      END,
      NEW.question_id,
      NEW.answer_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle reputation changes when votes are deleted
CREATE OR REPLACE FUNCTION handle_vote_delete()
RETURNS TRIGGER AS $$
DECLARE
  target_author_id UUID;
  reputation_change INTEGER;
BEGIN
  -- Determine the target author and reputation change to reverse
  IF OLD.question_id IS NOT NULL THEN
    SELECT author_id INTO target_author_id FROM questions WHERE id = OLD.question_id;
    reputation_change = CASE WHEN OLD.is_upvote THEN -5 ELSE 2 END;
  ELSIF OLD.answer_id IS NOT NULL THEN
    SELECT author_id INTO target_author_id FROM answers WHERE id = OLD.answer_id;
    reputation_change = CASE WHEN OLD.is_upvote THEN -10 ELSE 2 END;
  END IF;

  -- Update the user's reputation
  IF target_author_id IS NOT NULL THEN
    UPDATE profiles 
    SET reputation = GREATEST(1, reputation + reputation_change)
    WHERE user_id = target_author_id;
    
    -- Log reputation history
    INSERT INTO reputation_history (
      user_id,
      points,
      reason,
      question_id,
      answer_id
    ) VALUES (
      target_author_id,
      reputation_change,
      CASE 
        WHEN OLD.question_id IS NOT NULL THEN 'Question vote removed'
        ELSE 'Answer vote removed'
      END,
      OLD.question_id,
      OLD.answer_id
    );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for reputation updates
CREATE TRIGGER vote_insert_reputation_trigger
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_on_vote();

CREATE TRIGGER vote_update_reputation_trigger
  AFTER UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION handle_vote_update();

CREATE TRIGGER vote_delete_reputation_trigger
  AFTER DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION handle_vote_delete();