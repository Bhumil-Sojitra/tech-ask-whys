import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import VoteButtons from './VoteButtons';
import CommentSection from './CommentSection';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Answer {
  id: string;
  content: string;
  created_at: string;
  is_accepted: boolean;
  author_id: string;
  author: {
    username: string;
    avatar_url?: string;
    reputation: number;
  };
  votes: { upvotes: number; downvotes: number };
}

interface AnswerCardProps {
  answer: Answer;
  questionAuthorId?: string;
  isAccepted: boolean;
  onUpdate: () => void;
}

const AnswerCard = ({ answer, questionAuthorId, isAccepted, onUpdate }: AnswerCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDeleteAnswer = async () => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this answer?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('answers')
        .delete()
        .eq('id', answer.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Answer deleted successfully.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete answer.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className={`${isAccepted ? 'border-success bg-success/5' : ''}`}>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            {/* Vote Buttons */}
            <VoteButtons
              targetType="answer"
              targetId={answer.id}
              votes={answer.votes}
              onVoteChange={onUpdate}
            />

            {/* Answer Content */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isAccepted && (
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                        Accepted Answer
                      </Badge>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <MarkdownRenderer content={answer.content} />
                  </div>
                </div>
              </div>

              {/* Answer Meta */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  answered {formatDistanceToNow(new Date(answer.created_at))} ago
                </div>
                
                <div className="flex items-center space-x-3">
                  {user?.id === answer.author_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteAnswer}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={answer.author?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {answer.author?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <Link 
                      to={`/profile/${answer.author?.username}`}
                      className="font-medium hover:text-primary"
                    >
                      {answer.author?.username}
                    </Link>
                    <div className="text-xs text-reputation">
                      {answer.author?.reputation} reputation
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments on Answer */}
      <div className="ml-16">
        <CommentSection
          targetType="answer"
          targetId={answer.id}
        />
      </div>
    </div>
  );
};

export default AnswerCard;