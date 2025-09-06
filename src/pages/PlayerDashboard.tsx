import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Images,
  Calendar,
  Trophy,
  Users
} from 'lucide-react';

interface ParticipatedGame {
  id: string;
  title: string;
  status: string;
  created_at: string;
  is_winner: boolean;
  completion_time: string | null;
  player_count: number;
  photo_count: number;
}

const PlayerDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [games, setGames] = useState<ParticipatedGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchParticipatedGames();
    }
  }, [user]);

  const fetchParticipatedGames = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          is_winner,
          completion_time,
          games (
            id,
            title,
            status,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Get additional stats for each game
      const gameStats = await Promise.all(
        data.map(async (player: any) => {
          const gameId = player.games.id;
          
          // Get player count
          const { count: playerCount } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('game_id', gameId);

          // Get photo count for this player
          const { count: photoCount } = await supabase
            .from('player_progress')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', player.id)
            .not('photo_url', 'is', null);

          return {
            id: gameId,
            title: player.games.title,
            status: player.games.status,
            created_at: player.games.created_at,
            is_winner: player.is_winner,
            completion_time: player.completion_time,
            player_count: playerCount || 0,
            photo_count: photoCount || 0
          };
        })
      );

      setGames(gameStats);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading games',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1">
            <Link to="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">My Bingo Games</h1>
              <p className="text-muted-foreground">Games you've participated in</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} className="w-full sm:w-auto">
            Sign Out
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{games.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wins</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{games.filter(g => g.is_winner).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photos Taken</CardTitle>
              <Images className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{games.reduce((sum, g) => sum + g.photo_count, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Games List */}
        {games.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No games yet</p>
                <p className="text-sm text-muted-foreground">Join a game to see it here!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Games</h2>
            <div className="grid gap-4">
              {games.map((game) => (
                <Card key={game.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{game.title}</span>
                          {game.is_winner && <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {game.photo_count > 0 && (
                            <Link to={`/game/${game.id}/gallery`} className="w-full sm:w-auto">
                              <Button variant="outline" size="sm" className="w-full">
                                <Images className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">View Gallery</span>
                                <span className="sm:hidden">Gallery</span>
                              </Button>
                            </Link>
                          )}
                          {game.completion_time && (
                            <Badge variant="secondary" className="text-center">
                              <span className="hidden sm:inline">Completed {new Date(game.completion_time).toLocaleDateString()}</span>
                              <span className="sm:hidden">Done ✓</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-sm">
                          <Badge 
                            variant="secondary" 
                            className={`${getStatusColor(game.status)} text-white w-fit`}
                          >
                            {game.status}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {game.player_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Images className="h-3 w-3" />
                            {game.photo_count}
                          </span>
                          <span className="flex items-center gap-1 col-span-2 sm:col-span-1">
                            <Calendar className="h-3 w-3" />
                            <span className="hidden sm:inline">{new Date(game.created_at).toLocaleDateString()}</span>
                            <span className="sm:hidden">{new Date(game.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDashboard;