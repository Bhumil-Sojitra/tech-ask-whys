import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface VoteButtonsProps {
  targetType: 'question' | 'answer';
  targetId: string;
  votes: { upvotes: number; downvotes: number };
  onVoteChange: () => void;
}

const VoteButtons = ({ targetType, targetId, votes, onVoteChange }: VoteButtonsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserVote();
    }
  }, [user, targetId]);

  const fetchUserVote = async () => {
    try {
      const { data } = await supabase
        .from('votes')
        .select('is_upvote')
        .eq('user_id', user?.id)
        .eq(targetType === 'question' ? 'question_id' : 'answer_id', targetId)
        .maybeSingle();

      setUserVote(data ? data.is_upvote : null);
    } catch (error) {
      console.error('Failed to fetch user vote:', error);
    }
  };

  const handleVote = async (isUpvote: boolean) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote.",
        variant: "destructive",
      });
      return;
    }

    if (userVote === isUpvote) {
      // Remove vote if clicking the same vote
      await removeVote();
    } else {
      // Add or update vote
      await submitVote(isUpvote);
    }
  };

  const submitVote = async (isUpvote: boolean) => {
    setLoading(true);
    
    try {
      const voteData = {
        user_id: user?.id,
        is_upvote: isUpvote,
        [targetType === 'question' ? 'question_id' : 'answer_id']: targetId,
      };

      if (userVote !== null) {
        // Update existing vote
        const { error } = await supabase
          .from('votes')
          .update({ is_upvote: isUpvote })
          .eq('user_id', user?.id)
          .eq(targetType === 'question' ? 'question_id' : 'answer_id', targetId);

        if (error) throw error;
      } else {
        // Insert new vote
        const { error } = await supabase
          .from('votes')
          .insert(voteData);

        if (error) throw error;
      }

      setUserVote(isUpvote);
      onVoteChange();
      
      toast({
        title: "Vote Recorded",
        description: `You ${isUpvote ? 'upvoted' : 'downvoted'} this ${targetType}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record vote.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeVote = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', user?.id)
        .eq(targetType === 'question' ? 'question_id' : 'answer_id', targetId);

      if (error) throw error;

      setUserVote(null);
      onVoteChange();
      
      toast({
        title: "Vote Removed",
        description: `Your vote on this ${targetType} has been removed.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove vote.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const score = votes.upvotes - votes.downvotes;

  return (
    <div className="flex flex-col items-center space-y-2 min-w-[60px]">
      <Button
        variant={userVote === true ? "default" : "outline"}
        size="icon"
        onClick={() => handleVote(true)}
        disabled={loading}
        className={userVote === true ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      
      <div className="text-center">
        <div className={`text-lg font-bold ${score > 0 ? 'text-success' : score < 0 ? 'text-destructive' : ''}`}>
          {score}
        </div>
      </div>
      
      <Button
        variant={userVote === false ? "default" : "outline"}
        size="icon"
        onClick={() => handleVote(false)}
        disabled={loading}
        className={userVote === false ? "bg-destructive text-destructive-foreground" : "hover:bg-destructive/10"}
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default VoteButtons;