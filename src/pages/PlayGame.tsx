import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Users, 
  Trophy,
  Camera,
  CheckCircle2
} from 'lucide-react';

interface GameData {
  id: string;
  title: string;
  card_size: number;
  status: string;
  players: Array<{
    id: string;
    name: string;
    is_winner: boolean;
    completion_time?: string;
  }>;
  bingo_items: Array<{
    id: string;
    position: number;
    text_prompt: string;
  }>;
}

interface PlayerProgress {
  [key: string]: {
    completed: boolean;
    photo_url?: string;
    person_name: string;
  };
}

const winningMessages = [
  "Congratulations you checked all the boxes!",
  "Bingo!",
  "LETS GOOO!",
  "You are a Certified Social Beast!"
];

const PlayGame = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<GameData | null>(null);
  const [progress, setProgress] = useState<PlayerProgress>({});
  const [loading, setLoading] = useState(true);
  const [showPersonDialog, setShowPersonDialog] = useState(false);
  const [selectedBingoItem, setSelectedBingoItem] = useState<string | null>(null);
  const [selectedBingoPrompt, setSelectedBingoPrompt] = useState<string>('');
  const [personName, setPersonName] = useState('');
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [winMessage, setWinMessage] = useState('');

  useEffect(() => {
    if (playerId && user) {
      fetchGameData();
    }
  }, [playerId, user]);

  const fetchGameData = async () => {
    try {
      // First get the player data to find the game
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('game_id, name, is_winner')
        .eq('id', playerId)
        .eq('user_id', user?.id)
        .single();

      if (playerError) throw playerError;

      // Then get the full game data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select(`
          id,
          title,
          card_size,
          status,
          players (
            id,
            name,
            is_winner,
            completion_time
          ),
          bingo_items (
            id,
            position,
            text_prompt
          )
        `)
        .eq('id', playerData.game_id)
        .single();

      if (gameError) throw gameError;

      setGame(gameData);

      // Get player progress
      const { data: progressData, error: progressError } = await supabase
        .from('player_progress')
        .select('bingo_item_id, photo_url, person_name')
        .eq('player_id', playerId);

      if (progressError) throw progressError;

      // Convert to progress object
      const progressMap: PlayerProgress = {};
      progressData.forEach((item) => {
        progressMap[item.bingo_item_id] = {
          completed: true,
          photo_url: item.photo_url || undefined,
          person_name: item.person_name
        };
      });

      setProgress(progressMap);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading game',
        description: error.message,
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkWinCondition = async (newProgress: PlayerProgress) => {
    if (!game) return;
    
    const totalItems = game.bingo_items.length;
    const completedItems = Object.keys(newProgress).length;
    
    if (completedItems === totalItems && game.status === 'active') {
      // Mark player as completed in database
      try {
        await supabase
          .from('players')
          .update({ completion_time: new Date().toISOString() })
          .eq('id', playerId);
          
        // Update local game state to show DONE status
        setGame(prev => prev ? {
          ...prev,
          players: prev.players.map(player => 
            player.id === playerId 
              ? { ...player, completion_time: new Date().toISOString() }
              : player
          )
        } : null);
      } catch (error) {
        console.error('Error updating player completion status:', error);
      }
      
      const randomMessage = winningMessages[Math.floor(Math.random() * winningMessages.length)];
      setWinMessage(randomMessage);
      setShowWinCelebration(true);
    }
  };

  const markItemCompleted = async (bingoItemId: string, personName: string) => {
    try {
      const { error } = await supabase
        .from('player_progress')
        .insert({
          player_id: playerId,
          bingo_item_id: bingoItemId,
          person_name: personName
        });

      if (error) throw error;

      const newProgress = {
        ...progress,
        [bingoItemId]: {
          completed: true,
          person_name: personName
        }
      };
      
      setProgress(newProgress);
      await checkWinCondition(newProgress);

      toast({
        title: 'Item completed!',
        description: `Marked "${personName}" for this item.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const gridCols = game?.card_size === 9 ? 'grid-cols-3' : 'grid-cols-5';

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading game...</div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Game not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{game.title}</h1>
              <Badge className={`${game.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} text-white mt-2`}>
                {game.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            {game.players.length} players
          </div>
        </div>

        {/* Game Status Message */}
        {game.status === 'lobby' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-lg">Waiting for the host to start the game...</p>
                <p className="text-muted-foreground mt-2">The host will begin when everyone is ready!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {game.status === 'completed' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-lg font-semibold">Game Complete!</p>
                <p className="text-muted-foreground">Thanks for playing Social Bingo!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bingo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Bingo Card</CardTitle>
            <CardDescription>
              {game.status === 'active' 
                ? "Find people who match each description and mark them off!" 
                : game.status === 'lobby'
                ? "Your bingo card is ready - waiting for game to start"
                : "Game has ended"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`grid ${gridCols} gap-3`}>
              {game.bingo_items
                .sort((a, b) => a.position - b.position)
                .map((item) => {
                  const isCompleted = progress[item.id]?.completed || false;
                  return (
                    <div
                      key={item.id}
                      className={`
                        border rounded-lg p-4 min-h-[120px] flex flex-col items-center justify-center text-center text-sm
                        ${isCompleted 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-background border-border hover:bg-accent'
                        }
                        ${game.status === 'active' && !isCompleted ? 'cursor-pointer' : ''}
                      `}
                      onClick={() => {
                        if (game.status === 'active' && !isCompleted) {
                          setSelectedBingoItem(item.id);
                          setSelectedBingoPrompt(item.text_prompt);
                          setPersonName('');
                          setShowPersonDialog(true);
                        }
                      }}
                    >
                      {isCompleted && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
                      )}
                      <p className="font-medium mb-2">{item.text_prompt}</p>
                      {isCompleted && progress[item.id]?.person_name && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ {progress[item.id].person_name}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle>Players in Game</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {game.players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{player.name}</span>
                  <div className="flex items-center gap-2">
                    {player.completion_time && (
                      <Badge variant="secondary" className="text-xs">
                        DONE
                      </Badge>
                    )}
                    {player.is_winner && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600">Winner!</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Person Name Dialog */}
        <Dialog open={showPersonDialog} onOpenChange={setShowPersonDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mark Item Complete</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Who matches: "{selectedBingoPrompt}"?
              </p>
              <Input
                placeholder="Enter their name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && personName.trim() && selectedBingoItem) {
                    markItemCompleted(selectedBingoItem, personName.trim());
                    setShowPersonDialog(false);
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPersonDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (personName.trim() && selectedBingoItem) {
                    markItemCompleted(selectedBingoItem, personName.trim());
                    setShowPersonDialog(false);
                  }
                }}
                disabled={!personName.trim()}
              >
                Mark Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Win Celebration Dialog */}
        <Dialog open={showWinCelebration} onOpenChange={setShowWinCelebration}>
          <DialogContent className="sm:max-w-md text-center">
            <div className="fireworks-container">
              <div className="firework"></div>
              <div className="firework"></div>
              <div className="firework"></div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary mb-4">
                🎉 {winMessage} 🎉
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto animate-bounce" />
              <p className="text-lg text-muted-foreground">
                You've completed your entire bingo card!
              </p>
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={() => setShowWinCelebration(false)}>
                Awesome!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PlayGame;