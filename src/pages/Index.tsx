import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="mb-4 text-4xl font-bold">Social Bingo</h1>
        <p className="text-xl text-muted-foreground">Interactive social bingo games</p>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-lg">Welcome back, Host!</p>
            <div className="space-x-4">
              <Link to="/host">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={signOut}>Sign Out</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">Host a Social Bingo game</p>
            <Link to="/auth">
              <Button size="lg">Sign In as Host</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
