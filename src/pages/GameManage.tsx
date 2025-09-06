import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Users, 
  Copy, 
  Play, 
  Square, 
  Trophy,
  Clock,
  ExternalLink,
  Images 
} from 'lucide-react';

interface GameData {
  id: string;
  title: string;
  card_size: number;
  invite_code: string;
  status: string;
  created_at: string;
  players: Array<{
    id: string;
    name: string;
    joined_at: string;
    is_winner: boolean;
    completion_time?: string;
  }>;
  bingo_items: Array<{
    id: string;
    position: number;
    text_prompt: string;
  }>;
}

const GameManage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameId && user) {
      fetchGameData();
    }
  }, [gameId, user]);

  const fetchGameData = async () => {
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
          host_id,
          players (
            id,
            name,
            joined_at,
            is_winner,
            completion_time
          ),
          bingo_items (
            id,
            position,
            text_prompt
          )
        `)
        .eq('id', gameId)
        .single();

      if (error) throw error;

      // Verify user is the host
      if (data.host_id !== user?.id) {
        toast({
          variant: 'destructive',
          title: 'Access denied',
          description: 'You are not the host of this game.',
        });
        navigate('/host');
        return;
      }

      setGame(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading game',
        description: error.message,
      });
      navigate('/host');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (!game) return;
    const inviteLink = `${window.location.origin}/join/${game.invite_code}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Invite link copied!',
      description: 'Share this link with players to join your game.',
    });
  };

  const startGame = async () => {
    if (!game) return;
    
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', game.id);

      if (error) throw error;

      toast({
        title: 'Game started!',
        description: 'Players can now start completing their bingo cards.',
      });

      setGame({ ...game, status: 'active' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error starting game',
        description: error.message,
      });
    }
  };

  const endGame = async () => {
    if (!game) return;
    
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', game.id);

      if (error) throw error;

      toast({
        title: 'Game ended!',
        description: 'The game has been completed.',
      });

      setGame({ ...game, status: 'completed' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error ending game',
        description: error.message,
      });
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

  const gridCols = game?.card_size === 9 ? 'grid-cols-3' : 'grid-cols-5';

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading game...</div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Game not found</div>
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
            <Link to="/host">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-bold truncate">{game.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(game.status)} text-white`}>
                    {game.status}
                  </Badge>
                  <Badge variant="outline">
                    {game.card_size === 9 ? '3×3' : '5×5'}
                  </Badge>
                </div>
                <span className="text-muted-foreground text-sm truncate">Code: {game.invite_code}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <Link to={`/game/${gameId}/gallery`} className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full">
                  <Images className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">View Gallery</span>
                  <span className="sm:hidden">Gallery</span>
                </Button>
              </Link>
              <Button variant="outline" onClick={copyInviteLink} className="flex-1 sm:flex-initial">
                <Copy className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Copy Invite Link</span>
                <span className="sm:hidden">Copy</span>
              </Button>
            </div>
            {game.status === 'lobby' && (
              <Button onClick={startGame} disabled={game.players.length === 0} className="w-full sm:w-auto">
                <Play className="h-4 w-4 mr-2" />
                Start Game
              </Button>
            )}
            {game.status === 'active' && (
              <Button variant="destructive" onClick={endGame} className="w-full sm:w-auto">
                End Game
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({game.players.length})
                </CardTitle>
                <CardDescription>
                  Players who have joined the game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {game.players.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No players have joined yet. Share the invite link!
                  </p>
                ) : (
                  game.players
                    .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())
                    .map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(player.joined_at).toLocaleTimeString()}
                          </p>
                        </div>
                        {player.is_winner && (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs">Winner</span>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bingo Card Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Square className="h-5 w-5" />
                  Bingo Card Preview
                </CardTitle>
                <CardDescription>
                  This is what players see on their bingo cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid ${gridCols} gap-1 sm:gap-2`}>
                  {game.bingo_items
                    .sort((a, b) => a.position - b.position)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="border rounded p-2 sm:p-3 min-h-[60px] sm:min-h-[80px] flex items-center justify-center text-center text-xs sm:text-sm bg-muted"
                      >
                        {item.text_prompt}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game Instructions */}
        {game.status === 'lobby' && (
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Share the invite link</p>
                  <p className="text-sm text-muted-foreground">Copy the invite link and share it with your players</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Wait for players to join</p>
                  <p className="text-sm text-muted-foreground">Players will appear in the list above as they join</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Start the game</p>
                  <p className="text-sm text-muted-foreground">Click "Start Game" when everyone is ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GameManage;