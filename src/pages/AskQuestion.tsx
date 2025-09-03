import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';
import MarkdownEditor from '@/components/MarkdownEditor';

const AskQuestion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to ask a question.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          title: title.trim(),
          description: description.trim(),
          author_id: user.id,
        })
        .select()
        .single();

      if (questionError) {
        throw questionError;
      }

      // Create/link tags
      for (const tagName of tags) {
        // Check if tag exists
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .single();

        let tagId;
        if (!existingTag) {
          // Create new tag
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select('id')
            .single();

          if (tagError) throw tagError;
          tagId = newTag.id;
        } else {
          tagId = existingTag.id;
        }

        // Link tag to question
        const { error: linkError } = await supabase
          .from('question_tags')
          .insert({
            question_id: question.id,
            tag_id: tagId,
          });

        if (linkError) throw linkError;
      }

      toast({
        title: "Success!",
        description: "Your question has been posted.",
      });

      navigate(`/questions/${question.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post question.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to sign in to ask a question.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Ask a Question</h1>
          <p className="text-muted-foreground">
            Get help from the TechWhys community by asking detailed questions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
              <CardDescription>
                Be specific and imagine you're asking a question to another person.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your programming question? Be specific."
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {title.length}/150 characters
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description (Markdown supported)
                </label>
                <MarkdownEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Provide all the details someone would need to understand and answer your question. You can use **markdown** formatting!"
                  height={300}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/5000 characters • Markdown formatting supported
                </p>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add up to 5 tags..."
                    disabled={tags.length >= 5}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tags help other users find your question. Maximum 5 tags.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Posting...' : 'Post Your Question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskQuestion;