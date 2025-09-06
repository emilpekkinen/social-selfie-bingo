import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Clock, Trophy, ExternalLink } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  card_size: number;
  invite_code: string;
  status: string;
  created_at: string;
  player_count?: number;
}

const HostDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGames();
    }
  }, [user]);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          title,
          card_size,
          invite_code,
          status,
          created_at,
          players!inner(id)
        `)
        .eq('host_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const gamesWithPlayerCount = data?.map(game => ({
        ...game,
        player_count: game.players?.length || 0
      })) || [];

      setGames(gamesWithPlayerCount);
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
      case 'lobby': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const inviteLink = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Invite link copied!',
      description: 'Share this link with players to join your game.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Host Dashboard</h1>
            <p className="text-muted-foreground">Manage your Social Bingo games</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link to="/create-game" className="w-full sm:w-auto">
              <Button size="lg" className="flex items-center justify-center gap-2 w-full">
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Create New Game</span>
                <span className="sm:hidden">Create Game</span>
              </Button>
            </Link>
            <Button variant="outline" onClick={signOut} className="w-full sm:w-auto">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{games.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Games</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {games.filter(g => g.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {games.reduce((sum, game) => sum + (game.player_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Games</h2>
          {games.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No games yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first Social Bingo game to get started
                </p>
                <Link to="/create-game">
                  <Button>Create Your First Game</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => (
                <Card key={game.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg font-semibold truncate">{game.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`${getStatusColor(game.status)} text-white`}
                            >
                              {game.status}
                            </Badge>
                            <Badge variant="outline">
                              {game.card_size === 9 ? '3×3' : '5×5'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {game.player_count} players
                          </span>
                          <span className="truncate">Code: {game.invite_code}</span>
                          <span className="hidden sm:inline">Created {new Date(game.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(game.invite_code)}
                          className="w-full sm:w-auto"
                        >
                          <span className="hidden sm:inline">Copy Invite Link</span>
                          <span className="sm:hidden">Copy Link</span>
                        </Button>
                        <Link to={`/game/${game.id}/manage`} className="w-full sm:w-auto">
                          <Button size="sm" className="flex items-center justify-center gap-1 w-full">
                            <ExternalLink className="h-4 w-4" />
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;