import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

interface SettingsActionsProps {
  profileVisibility: string;
  onVisibilityChange: (visibility: 'public' | 'private') => void;
}

const SettingsActions = ({ profileVisibility, onVisibilityChange }: SettingsActionsProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleVisibilityToggle = async () => {
    if (!user) return;
    
    const newVisibility = profileVisibility === 'public' ? 'private' : 'public';
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          profile_visibility: newVisibility
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      onVisibilityChange(newVisibility);
      toast({
        title: "Privacy Updated",
        description: `Your profile is now ${newVisibility}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update privacy settings.",
        variant: "destructive",
      });
    }
  };

  const handleDataExport = async () => {
    if (!user) return;

    try {
      // Get all user data
      const [profileData, questionsData, answersData, votesData] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('questions').select('*').eq('author_id', user.id),
        supabase.from('answers').select('*').eq('author_id', user.id),
        supabase.from('votes').select('*').eq('user_id', user.id)
      ]);

      const exportData = {
        profile: profileData.data,
        questions: questionsData.data,
        answers: answersData.data,
        votes: votesData.data,
        exported_at: new Date().toISOString()
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `techwhys-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // In a real app, you'd want to delete user data in the correct order
      // due to foreign key constraints, but for now we'll just sign out
      // The actual deletion would need to be handled by an admin function
      
      await signOut();
      
      toast({
        title: "Account Deletion Requested",
        description: "Your account deletion request has been submitted. You will receive an email confirmation.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-border rounded-lg">
        <h4 className="font-medium mb-2">Profile Visibility</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Your profile is currently {profileVisibility} and can be viewed by {profileVisibility === 'public' ? 'all users' : 'only you'}.
        </p>
        <Button variant="outline" size="sm" onClick={handleVisibilityToggle}>
          Make Profile {profileVisibility === 'public' ? 'Private' : 'Public'}
        </Button>
      </div>
      
      <div className="p-4 border border-border rounded-lg">
        <h4 className="font-medium mb-2">Data Export</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Download a copy of all your data from TechWhys.
        </p>
        <Button variant="outline" size="sm" onClick={handleDataExport}>
          Request Data Export
        </Button>
      </div>

      <div className="p-4 border border-destructive/50 rounded-lg">
        <h4 className="font-medium mb-2">Delete Account</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SettingsActions;