import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
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
          author_id,
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

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Comment deleted successfully.",
      });

      fetchComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing Comments */}
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-muted pl-4 py-2">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm text-muted-foreground flex-1">{comment.content}</p>
                {user?.id === comment.author_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-destructive hover:text-destructive ml-2 p-1 h-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
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
