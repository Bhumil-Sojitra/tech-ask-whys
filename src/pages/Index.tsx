import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, MessageCircle, Eye, CheckCircle, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TopContributors from '@/components/TopContributors';

interface Question {
  id: string;
  title: string;
  description: string;
  views: number;
  created_at: string;
  author: {
    username: string;
    avatar_url?: string;
    reputation: number;
  };
  tags: { name: string }[];
  votes: { upvotes: number; downvotes: number };
  answer_count: number;
  accepted_answer_id?: string;
}

const Index = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching questions:', error);
        return;
      }

      // Get vote counts for each question
      const questionsWithVotes = await Promise.all(
        data.map(async (question) => {
          const { data: votes } = await supabase.rpc('get_vote_counts', {
            target_type: 'question',
            target_id: question.id
          });

          const { count: answerCount } = await supabase
            .from('answers')
            .select('*', { count: 'exact', head: true })
            .eq('question_id', question.id);

          return {
            ...question,
            author: question.profiles,
            tags: question.question_tags.map((qt: any) => ({ name: qt.tags.name })),
            votes: votes?.[0] || { upvotes: 0, downvotes: 0 },
            answer_count: answerCount || 0,
          };
        })
      );

      setQuestions(questionsWithVotes);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          {/* Main content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Top Questions</h1>
                <p className="text-muted-foreground">
                  {questions.length} questions
                </p>
              </div>
              {user && (
                <Button asChild>
                  <Link to="/ask">
                    <Plus className="h-4 w-4 mr-2" />
                    Ask Question
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4">
            {/* Top Contributors */}
            <TopContributors />

            {/* Stats Card */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-primary">{questions.length}</div>
                  <div className="text-sm text-muted-foreground">Questions Asked</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to ask a question in our community!
              </p>
              {user && (
                <Button asChild>
                  <Link to="/ask">Ask the First Question</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  {/* Vote and Stats */}
                  <div className="flex flex-col items-center space-y-2 min-w-[60px]">
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {question.votes.upvotes - question.votes.downvotes}
                      </div>
                      <div className="text-xs text-muted-foreground">votes</div>
                    </div>
                    
                    <div className={`text-center ${question.accepted_answer_id ? 'text-success' : ''}`}>
                      <div className="text-sm font-medium flex items-center">
                        {question.accepted_answer_id && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {question.answer_count}
                      </div>
                      <div className="text-xs text-muted-foreground">answers</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">{question.views}</div>
                      <div className="text-xs text-muted-foreground">views</div>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1">
                    <Link 
                      to={`/questions/${question.id}`} 
                      className="block hover:text-primary"
                    >
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                        {question.title}
                      </h3>
                    </Link>
                    
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {question.description.length > 150 
                        ? question.description.substring(0, 150) + '...' 
                        : question.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {question.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>

                    {/* Author and Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={question.author?.avatar_url} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {question.author?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {question.author?.username}
                        </span>
                        <span className="text-xs text-reputation font-medium">
                          {question.author?.reputation}
                        </span>
                      </div>
                      
                      <span className="text-xs text-muted-foreground">
                        asked {formatDistanceToNow(new Date(question.created_at))} ago
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Index;
