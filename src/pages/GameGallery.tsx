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
  Images,
  Download,
  User
} from 'lucide-react';

interface GamePhoto {
  id: string;
  photo_url: string;
  person_name: string;
  completed_at: string;
  text_prompt: string;
  player_name: string;
}

interface GameData {
  id: string;
  title: string;
  status: string;
}

const GameGallery = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<GameData | null>(null);
  const [photos, setPhotos] = useState<GamePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameId && user) {
      fetchGameGallery();
    }
  }, [gameId, user]);

  const fetchGameGallery = async () => {
    try {
      // Check if user is host or participant of this game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('id, title, status, host_id')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      // Check if user is host
      const isHost = gameData.host_id === user?.id;
      
      // Check if user is a participant
      let isParticipant = false;
      if (!isHost) {
        const { data: playerData } = await supabase
          .from('players')
          .select('id')
          .eq('game_id', gameId)
          .eq('user_id', user?.id)
          .single();
        
        isParticipant = !!playerData;
      }

      if (!isHost && !isParticipant) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'Only the host and participants can view the game gallery.',
        });
        navigate('/');
        return;
      }

      setGame(gameData);

      // Get all photos from this game
      const { data: photosData, error: photosError } = await supabase
        .from('player_progress')
        .select(`
          id,
          photo_url,
          person_name,
          completed_at,
          bingo_items (
            text_prompt
          ),
          players!inner (
            name,
            game_id
          )
        `)
        .eq('players.game_id', gameId)
        .not('photo_url', 'is', null);

      if (photosError) throw photosError;

      const processedPhotos = photosData.map((item: any) => ({
        id: item.id,
        photo_url: item.photo_url,
        person_name: item.person_name,
        completed_at: item.completed_at,
        text_prompt: item.bingo_items?.text_prompt || 'Unknown prompt',
        player_name: item.players?.name || 'Unknown player'
      }));

      setPhotos(processedPhotos);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading gallery',
        description: error.message,
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading gallery...</div>
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/game/${gameId}/manage`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Game
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{game.title} Gallery</h1>
              <div className="flex items-center gap-2 mt-2">
                <Images className="h-4 w-4" />
                <Badge variant="secondary">
                  {photos.length} photos
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {photos.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Images className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No photos yet</p>
                <p className="text-sm text-muted-foreground">Players haven't uploaded any photos for this game.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img 
                    src={photo.photo_url} 
                    alt={photo.text_prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm mb-2">{photo.text_prompt}</h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>Person: {photo.person_name}</span>
                    </div>
                    <div>
                      Submitted by: {photo.player_name}
                    </div>
                    <div>
                      {new Date(photo.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => {
                      // Create download link
                      const link = document.createElement('a');
                      link.href = photo.photo_url;
                      link.download = `${photo.text_prompt}-${photo.person_name}.jpg`;
                      link.click();
                    }}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameGallery;