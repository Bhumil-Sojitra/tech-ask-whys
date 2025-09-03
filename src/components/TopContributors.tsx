import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';

interface Contributor {
  id: string;
  username: string;
  avatar_url?: string;
  reputation: number;
}

const TopContributors = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopContributors();
  }, []);

  const fetchTopContributors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, reputation')
        .order('reputation', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching top contributors:', error);
        return;
      }

      setContributors(data || []);
    } catch (error) {
      console.error('Error fetching top contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-reputation" />
            <span>Top Contributors</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted"></div>
                <div className="h-8 w-8 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-reputation" />
          <span>Top Contributors</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          {contributors.map((contributor, index) => (
            <div key={contributor.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  #{index + 1}
                </div>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={contributor.avatar_url} />
                <AvatarFallback className="bg-muted text-xs">
                  {contributor.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{contributor.username}</p>
                <p className="text-xs text-reputation">{contributor.reputation} reputation</p>
              </div>
            </div>
          ))}
          {contributors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contributors yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopContributors;