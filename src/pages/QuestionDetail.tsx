import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, ArrowDown, MessageCircle, CheckCircle, Calendar, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import VoteButtons from '@/components/VoteButtons';
import AnswerCard from '@/components/AnswerCard';
import CommentSection from '@/components/CommentSection';

interface QuestionData {
  id: string;
  title: string;
  description: string;
  views: number;
  created_at: string;
  accepted_answer_id?: string;
  author: {
    username: string;
    avatar_url?: string;
    reputation: number;
  };
  tags: { name: string }[];
  votes: { upvotes: number; downvotes: number };
}

interface Answer {
  id: string;
  content: string;
  created_at: string;
  is_accepted: boolean;
  author: {
    username: string;
    avatar_url?: string;
    reputation: number;
  };
  votes: { upvotes: number; downvotes: number };
}

const QuestionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuestionAndAnswers();
      incrementViewCount();
    }
  }, [id]);

  const fetchQuestionAndAnswers = async () => {
    try {
      // Fetch question details
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select(`
          id,
          title,
          description,
          views,
          created_at,
          accepted_answer_id,
          profiles!questions_author_id_fkey (
            username,
            avatar_url,
            reputation
          ),
          question_tags (
            tags (name)
          )
        `)
        .eq('id', id)
        .single();

      if (questionError) {
        throw questionError;
      }

      // Get vote counts for question
      const { data: questionVotes } = await supabase.rpc('get_vote_counts', {
        target_type: 'question',
        target_id: id
      });

      const formattedQuestion = {
        ...questionData,
        author: questionData.profiles,
        tags: questionData.question_tags.map((qt: any) => ({ name: qt.tags.name })),
        votes: questionVotes?.[0] || { upvotes: 0, downvotes: 0 },
      };

      setQuestion(formattedQuestion);

      // Fetch answers
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select(`
          id,
          content,
          created_at,
          is_accepted,
          profiles!answers_author_id_fkey (
            username,
            avatar_url,
            reputation
          )
        `)
        .eq('question_id', id)
        .order('is_accepted', { ascending: false })
        .order('created_at', { ascending: true });

      if (answersError) {
        throw answersError;
      }

      // Get vote counts for answers
      const answersWithVotes = await Promise.all(
        (answersData || []).map(async (answer) => {
          const { data: votes } = await supabase.rpc('get_vote_counts', {
            target_type: 'answer',
            target_id: answer.id
          });

          return {
            ...answer,
            author: answer.profiles,
            votes: votes?.[0] || { upvotes: 0, downvotes: 0 },
          };
        })
      );

      setAnswers(answersWithVotes);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load question.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase
        .from('questions')
        .update({ views: supabase.sql`views + 1` })
        .eq('id', id);
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post an answer.",
        variant: "destructive",
      });
      return;
    }

    if (!newAnswer.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your answer.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingAnswer(true);

    try {
      const { error } = await supabase
        .from('answers')
        .insert({
          content: newAnswer.trim(),
          question_id: id,
          author_id: user.id,
        });

      if (error) {
        throw error;
      }

      setNewAnswer('');
      toast({
        title: "Success!",
        description: "Your answer has been posted.",
      });

      // Refresh answers
      fetchQuestionAndAnswers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post answer.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Question Not Found</h2>
            <p className="text-muted-foreground">
              The question you're looking for doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Question Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex space-x-4">
              {/* Vote Buttons */}
              <VoteButtons
                targetType="question"
                targetId={question.id}
                votes={question.votes}
                onVoteChange={() => fetchQuestionAndAnswers()}
              />

              {/* Question Content */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold mb-3">{question.title}</h1>
                  
                  {/* Question Meta */}
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>asked {formatDistanceToNow(new Date(question.created_at))} ago</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{question.views} views</span>
                    </div>
                  </div>
                  
                  <div className="prose prose-sm max-w-none mb-4">
                    <p className="whitespace-pre-wrap">{question.description}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Author Info */}
                <div className="flex items-center space-x-3 pt-4 border-t">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={question.author?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {question.author?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link 
                      to={`/profile/${question.author?.username}`}
                      className="font-medium hover:text-primary"
                    >
                      {question.author?.username}
                    </Link>
                    <div className="text-xs text-reputation">
                      {question.author?.reputation} reputation
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments on Question */}
        <CommentSection
          targetType="question"
          targetId={question.id}
        />

        {/* Answers Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">
            {answers.length} Answer{answers.length !== 1 ? 's' : ''}
          </h2>

          {answers.map((answer) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              questionAuthorId={question.author?.username}
              isAccepted={answer.id === question.accepted_answer_id}
              onUpdate={() => fetchQuestionAndAnswers()}
            />
          ))}
        </div>

        {/* Answer Form */}
        {user ? (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Your Answer</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <Textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Write your answer here..."
                  rows={6}
                  maxLength={5000}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {newAnswer.length}/5000 characters
                  </p>
                  <Button type="submit" disabled={submittingAnswer || !newAnswer.trim()}>
                    {submittingAnswer ? 'Posting...' : 'Post Your Answer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Sign in to post an answer.
              </p>
              <Button asChild>
                <Link to="/auth?tab=signin">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;