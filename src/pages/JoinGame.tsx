import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Users, Grid3x3, Grid, Clock } from 'lucide-react';

interface GameInfo {
  id: string;
  title: string;
  card_size: number;
  status: string;
  player_count: number;
}

const JoinGame = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [playerName, setPlayerName] = useState('');
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      fetchGameInfo();
    }
  }, [inviteCode]);

  const fetchGameInfo = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_game', {
        invite_code: inviteCode
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setGameInfo(data[0]);
      } else {
        throw new Error('Game not found');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Game not found',
        description: 'Invalid invite code or game does not exist.',
      });
      setGameInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!user) {
      toast({
        variant: "destructive", 
        title: "Authentication required",
        description: "Please sign in to join games.",
      });
      navigate('/auth');
      return;
    }

    if (!gameInfo || !playerName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter your name to join the game.',
      });
      return;
    }

    if (gameInfo.status === 'completed') {
      toast({
        variant: 'destructive',
        title: 'Game ended',
        description: 'This game has already ended.',
      });
      return;
    }

    setJoining(true);

    try {
      const { data: playerData, error } = await supabase
        .from('players')
        .insert({
          game_id: gameInfo.id,
          name: playerName.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Joined successfully!',
        description: `Welcome to ${gameInfo.title}, ${playerName}!`,
      });

      // Navigate to the game interface
      navigate(`/play/${playerData.id}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error joining game',
        description: error.message,
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Game Not Found</CardTitle>
            <CardDescription>
              The invite link you used is invalid or the game no longer exists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Social Bingo</CardTitle>
          <CardDescription>Enter your name to join the game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!user && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
              <p className="text-sm text-destructive mb-3">
                You need to be signed in to join games.
              </p>
              <Link to="/auth">
                <Button size="sm" variant="destructive">
                  Sign In
                </Button>
              </Link>
            </div>
          )}

          {/* Game Info */}
          <div className="p-4 bg-accent rounded-lg space-y-2">
            <h3 className="font-semibold text-lg">{gameInfo.title}</h3>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {gameInfo.card_size === 9 ? (
                  <Grid3x3 className="h-4 w-4" />
                ) : (
                  <Grid className="h-4 w-4" />
                )}
                {gameInfo.card_size === 9 ? '3×3' : '5×5'} Card
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {gameInfo.player_count} players
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4" />
              Status: <span className="capitalize font-medium">{gameInfo.status}</span>
            </div>
          </div>

          {/* Join Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Your Name</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
                onKeyPress={(e) => e.key === 'Enter' && joinGame()}
                disabled={!user}
              />
            </div>

            <Button 
              onClick={joinGame}
              disabled={joining || !playerName.trim() || !user}
              className="w-full"
              size="lg"
            >
              {joining ? 'Joining...' : 'Join Game'}
            </Button>
          </div>

          {gameInfo.status === 'completed' && (
            <div className="text-center text-sm text-muted-foreground">
              This game has ended. You can no longer join.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinGame;