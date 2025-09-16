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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg text-center space-y-6">
        <h1 className="text-2xl sm:text-4xl font-bold">Social Bingo</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">Interactive social bingo games</p>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-lg">Welcome back!</p>
            <div className="flex flex-col gap-3 w-full">
              <Link to="/host" className="w-full">
                <Button size="lg" className="w-full">Host a Game</Button>
              </Link>
              <Link to="/player" className="w-full">
                <Button variant="outline" size="lg" className="w-full">My Games</Button>
              </Link>
              <div className="w-full">
                <JoinLobbyButton />
              </div>
            </div>
            <Button variant="ghost" onClick={signOut} className="mt-4">Sign Out</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">Host a Social Bingo game</p>
            <Link to="/auth" className="w-full">
              <Button size="lg" className="w-full">Sign In</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
