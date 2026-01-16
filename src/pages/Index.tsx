import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';
import { format } from 'date-fns';

const genderLabels: Record<string, string> = {
  'male': 'Male',
  'female': 'Female',
  'non-binary': 'Non-binary',
  'prefer-not-to-say': 'Prefer not to say',
};

const Index = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const displayGender = profile?.gender ? genderLabels[profile.gender] || profile.gender : 'Not specified';
  const displayDob = profile?.date_of_birth 
    ? format(new Date(profile.date_of_birth), 'MMMM d, yyyy')
    : 'Not specified';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Hello {displayName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gender</span>
              <span className="font-medium">{displayGender}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date of Birth</span>
              <span className="font-medium">{displayDob}</span>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
