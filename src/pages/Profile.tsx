import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Trophy, Calendar, MessageSquare, CheckCircle, Edit } from 'lucide-react';
import EditProfileDialog from '@/components/EditProfileDialog';

interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  bio?: string;
  reputation: number;
  avatar_url?: string;
  created_at: string;
}

interface Question {
  id: string;
  title: string;
  created_at: string;
  votes: { upvotes: number; downvotes: number };
  answer_count: number;
  accepted_answer_id?: string;
}

interface Answer {
  id: string;
  content: string;
  created_at: string;
  is_accepted: boolean;
  votes: { upvotes: number; downvotes: number };
  question: {
    id: string;
    title: string;
  };
}

const Profile = () => {
  const { username } = useParams();
  const { user, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isOwnProfile = currentUserProfile?.username === username;

  useEffect(() => {
    if (username) {
      fetchProfileData();
    }
  }, [username]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) {
        toast({
          title: "Error",
          description: "Profile not found.",
          variant: "destructive",
        });
        return;
      }

      setProfile(profileData);

      // Fetch user's questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select(`
          id,
          title,
          created_at,
          accepted_answer_id
        `)
        .eq('author_id', profileData.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (questionsData) {
        const questionsWithVotes = await Promise.all(
          questionsData.map(async (question) => {
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
              votes: votes?.[0] || { upvotes: 0, downvotes: 0 },
              answer_count: answerCount || 0,
            };
          })
        );

        setQuestions(questionsWithVotes);
      }

      // Fetch user's answers
      const { data: answersData } = await supabase
        .from('answers')
        .select(`
          id,
          content,
          created_at,
          is_accepted,
          questions!inner(id, title)
        `)
        .eq('author_id', profileData.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (answersData) {
        const answersWithVotes = await Promise.all(
          answersData.map(async (answer) => {
            const { data: votes } = await supabase.rpc('get_vote_counts', {
              target_type: 'answer',
              target_id: answer.id
            });

            return {
              ...answer,
              votes: votes?.[0] || { upvotes: 0, downvotes: 0 },
              question: answer.questions,
            };
          })
        );

        setAnswers(answersWithVotes);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-muted-foreground">
              The user you're looking for doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} alt={profile.username} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">{profile.username}</h1>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4 text-reputation" />
                        <span className="font-medium text-reputation">{profile.reputation}</span>
                        <span className="text-sm text-muted-foreground">reputation</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          Joined {formatDistanceToNow(new Date(profile.created_at))} ago
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="mt-4 text-muted-foreground">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{answers.length}</div>
              <div className="text-sm text-muted-foreground">Answers</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {answers.filter(a => a.is_accepted).length}
              </div>
              <div className="text-sm text-muted-foreground">Accepted Answers</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="answers">Answers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="questions" className="space-y-4">
            {questions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "You haven't" : `${profile.username} hasn't`} asked any questions yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              questions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 line-clamp-2">
                          <a 
                            href={`/questions/${question.id}`}
                            className="hover:text-primary"
                          >
                            {question.title}
                          </a>
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">
                              {question.votes.upvotes - question.votes.downvotes}
                            </span>
                            <span>votes</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${question.accepted_answer_id ? 'text-success' : ''}`}>
                            {question.accepted_answer_id && <CheckCircle className="h-3 w-3" />}
                            <span className="font-medium">{question.answer_count}</span>
                            <span>answers</span>
                          </div>
                          <span>
                            asked {formatDistanceToNow(new Date(question.created_at))} ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="answers" className="space-y-4">
            {answers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Answers Yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "You haven't" : `${profile.username} hasn't`} answered any questions yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              answers.map((answer) => (
                <Card key={answer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold line-clamp-1">
                          <a 
                            href={`/questions/${answer.question.id}#answer-${answer.id}`}
                            className="hover:text-primary"
                          >
                            {answer.question.title}
                          </a>
                        </h3>
                        {answer.is_accepted && (
                          <Badge variant="secondary" className="ml-2 bg-success/10 text-success border-success/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accepted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {answer.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">
                            {answer.votes.upvotes - answer.votes.downvotes}
                          </span>
                          <span>votes</span>
                        </div>
                        <span>
                          answered {formatDistanceToNow(new Date(answer.created_at))} ago
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profile}
          onProfileUpdate={() => {
            fetchProfileData();
          }}
        />
      )}
    </div>
  );
};

export default Profile;