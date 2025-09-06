import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import JoinLobbyButton from '@/components/JoinLobbyButton';

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
            <p className="text-lg">Welcome back!</p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link to="/host">
                <Button size="lg">Host a Game</Button>
              </Link>
              <Link to="/host">
                <Button variant="outline" size="lg">See Dashboard</Button>
              </Link>
              <JoinLobbyButton />
            </div>
            <Button variant="ghost" onClick={signOut} className="mt-4">Sign Out</Button>
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
