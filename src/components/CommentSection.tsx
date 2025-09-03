import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    username: string;
    avatar_url?: string;
    reputation: number;
  };
}

interface CommentSectionProps {
  targetType: 'question' | 'answer';
  targetId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ targetType, targetId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [targetId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profiles!comments_author_id_fkey (
            username,
            avatar_url,
            reputation
          )
        `)
        .eq(targetType === 'question' ? 'question_id' : 'answer_id', targetId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedComments = (data || []).map(comment => ({
        ...comment,
        author: comment.profiles
      }));

      setComments(formattedComments);
    } catch (error: any) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to comment.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // First get the user's profile to use user_id correctly  
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      const commentData = {
        content: newComment.trim(),
        author_id: user.id,
        [targetType === 'question' ? 'question_id' : 'answer_id']: targetId,
      };

      const { error } = await supabase
        .from('comments')
        .insert(commentData);

      if (error) throw error;

      setNewComment('');
      setShowCommentForm(false);
      
      toast({
        title: "Success!",
        description: "Your comment has been posted.",
      });

      // Refresh comments
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing Comments */}
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-muted pl-4 py-2">
              <p className="text-sm text-muted-foreground mb-1">{comment.content}</p>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Link 
                  to={`/profile/${comment.author?.username}`}
                  className="font-medium hover:text-primary"
                >
                  {comment.author?.username}
                </Link>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(comment.created_at))} ago</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Button/Form */}
      {!showCommentForm ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCommentForm(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Add a comment
        </Button>
      ) : (
        <form onSubmit={handleSubmitComment} className="space-y-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            maxLength={500}
            autoFocus
          />
          <div className="flex space-x-2">
            <Button 
              type="submit" 
              size="sm"
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? 'Posting...' : 'Post'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCommentForm(false);
                setNewComment('');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CommentSection;
