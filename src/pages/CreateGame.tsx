import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Grid3x3, Grid } from 'lucide-react';

const CreateGame = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [gameTitle, setGameTitle] = useState('');
  const [cardSize, setCardSize] = useState<'9' | '25'>('9');
  const [prompts, setPrompts] = useState<string[]>(Array(9).fill(''));
  const [loading, setLoading] = useState(false);

  const handleCardSizeChange = (newSize: '9' | '25') => {
    setCardSize(newSize);
    const size = newSize === '9' ? 9 : 25;
    setPrompts(Array(size).fill(''));
  };

  const updatePrompt = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  const createGame = async () => {
    if (!user) return;

    if (!gameTitle.trim()) {
      toast({
        variant: 'destructive',
        title: 'Game title required',
        description: 'Please enter a title for your game.',
      });
      return;
    }

    const filledPrompts = prompts.filter(p => p.trim());
    const requiredPrompts = cardSize === '9' ? 9 : 25;

    if (filledPrompts.length < requiredPrompts) {
      toast({
        variant: 'destructive',
        title: 'All prompts required',
        description: `Please fill in all ${requiredPrompts} bingo prompts.`,
      });
      return;
    }

    setLoading(true);

    try {
      // Generate unique invite code
      const { data: inviteCode } = await supabase.rpc('generate_invite_code');
      
      // Create the game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          host_id: user.id,
          title: gameTitle.trim(),
          card_size: parseInt(cardSize),
          invite_code: inviteCode,
          status: 'lobby'
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Create bingo items
      const bingoItems = prompts
        .filter(p => p.trim())
        .map((prompt, index) => ({
          game_id: gameData.id,
          position: index,
          text_prompt: prompt.trim()
        }));

      const { error: itemsError } = await supabase
        .from('bingo_items')
        .insert(bingoItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'Game created successfully!',
        description: `Your ${cardSize === '9' ? '3×3' : '5×5'} Social Bingo game is ready.`,
      });

      navigate(`/game/${gameData.id}/manage`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error creating game',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const gridCols = cardSize === '9' ? 'grid-cols-3' : 'grid-cols-5';
  const requiredPrompts = cardSize === '9' ? 9 : 25;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/host')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Social Bingo Game</CardTitle>
            <CardDescription>
              Set up your bingo card with custom prompts for players to complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Game Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Game Title</Label>
              <Input
                id="title"
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                placeholder="Enter a fun title for your game"
                maxLength={100}
              />
            </div>

            {/* Card Size Selection */}
            <div className="space-y-4">
              <Label>Card Size</Label>
              <RadioGroup 
                value={cardSize} 
                onValueChange={handleCardSizeChange}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent">
                  <RadioGroupItem value="9" id="3x3" />
                  <Label htmlFor="3x3" className="flex items-center gap-2 cursor-pointer">
                    <Grid3x3 className="h-5 w-5" />
                    3×3 Grid (9 squares)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent">
                  <RadioGroupItem value="25" id="5x5" />
                  <Label htmlFor="5x5" className="flex items-center gap-2 cursor-pointer">
                    <Grid className="h-5 w-5" />
                    5×5 Grid (25 squares)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Bingo Prompts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Bingo Prompts</Label>
                <span className="text-sm text-muted-foreground">
                  {prompts.filter(p => p.trim()).length} / {requiredPrompts}
                </span>
              </div>
              <div className={`grid ${gridCols} gap-3`}>
                {prompts.map((prompt, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Square {index + 1}
                    </Label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => updatePrompt(index, e.target.value)}
                      placeholder="Enter prompt..."
                      className="min-h-[80px] text-sm"
                      maxLength={200}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={createGame}
                disabled={loading}
                size="lg"
              >
                {loading ? 'Creating Game...' : 'Create Game'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateGame;