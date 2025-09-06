import React, { useState } from 'react';
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
import { ArrowLeft, Grid3x3, Grid, Upload, FileText, Shuffle } from 'lucide-react';

const BINGO_PROMPTS = [
  "Has traveled to more than 5 countries",
  "Owns a quirky mug collection",
  "Can play a musical instrument",
  "Knows how to juggle",
  "Has met a celebrity",
  "Loves pineapple on pizza",
  "Has run a marathon",
  "Can whistle loudly",
  "Has broken a bone",
  "Is a morning person",
  "Has a tattoo",
  "Can cook a signature dish",
  "Has a twin",
  "Knows how to salsa dance",
  "Has been on TV",
  "Speaks more than 2 languages",
  "Has a pet with an unusual name",
  "Is afraid of heights",
  "Loves board games",
  "Has tried bungee jumping",
  "Can recite a movie quote perfectly",
  "Has dyed their hair a wild color",
  "Loves karaoke nights",
  "Collects something unusual",
  "Knows how to knit or crochet",
  "Has a favorite ice cream flavor that's unusual",
  "Can wiggle their ears",
  "Has been camping in the wild",
  "Loves horror movies",
  "Has met someone famous by accident",
  "Knows how to skateboard",
  "Has ridden a horse",
  "Can solve a Rubik's cube",
  "Has a green thumb (loves plants)",
  "Prefers cats over dogs",
  "Prefers dogs over cats",
  "Loves rainy days",
  "Has been in a play or musical",
  "Can touch their toes without bending knees",
  "Has seen a shooting star",
  "Loves spicy food",
  "Has gone scuba diving or snorkeling",
  "Can whistle a tune",
  "Owns more than 20 pairs of shoes",
  "Has been in a parade",
  "Has dyed their hair more than 3 times",
  "Can say the alphabet backwards",
  "Knows how to hula hoop",
  "Loves reading mystery novels",
  "Can bake amazing cookies",
  "Has been on a cruise ship",
  "Wears mismatched socks sometimes",
  "Has given a public speech",
  "Loves roller coasters",
  "Doesn't drink coffee",
  "Has a favorite superhero",
  "Has lived in another country",
  "Can snap with both hands",
  "Knows all the words to a song by heart",
  "Owns something vintage",
  "Loves making TikTok or Instagram reels",
  "Has eaten something exotic",
  "Wears glasses",
  "Is the youngest sibling",
  "Is the oldest sibling",
  "Is an only child",
  "Loves to nap",
  "Has gotten lost in a new city",
  "Owns a funny hat",
  "Has written a poem or song",
  "Has attended a concert",
  "Collects magnets from places they visit",
  "Loves chocolate more than candy",
  "Has binge-watched an entire show in one weekend",
  "Knows how to ice skate",
  "Loves to swim",
  "Has been stung by a bee",
  "Can clap with one hand",
  "Loves autumn the most",
  "Has met their idol",
  "Has done yoga",
  "Can play chess",
  "Loves cooking new recipes",
  "Has taken a road trip",
  "Owns a board game collection",
  "Loves to dance",
  "Knows how to sew or mend clothes",
  "Has painted a picture",
  "Loves the beach more than the mountains",
  "Loves the mountains more than the beach",
  "Is afraid of spiders",
  "Has celebrated New Year's in another country",
  "Knows a fun party trick",
  "Can imitate a celebrity voice",
  "Loves taking photos",
  "Has sung in front of strangers",
  "Knows how to ride a bike",
  "Owns more than 50 books",
  "Loves puzzles",
  "Has been part of a sports team",
  "Knows a tongue twister really well",
  "Has fallen asleep at the movies",
  "Loves hot chocolate",
  "Prefers tea over coffee",
  "Owns a funny T-shirt",
  "Has made a snowman",
  "Loves watching documentaries",
  "Has volunteered for a cause",
  "Knows their zodiac sign",
  "Believes in lucky charms",
  "Has been on a Ferris wheel",
  "Knows how to play cards",
  "Owns a pet fish",
  "Knows a dance from TikTok",
  "Loves musicals",
  "Can say hello in 5 languages",
  "Has ridden a camel or elephant",
  "Has written in a journal or diary",
  "Loves theme parks",
  "Has fainted before",
  "Can roll their tongue",
  "Has fallen asleep in class or at work",
  "Has a favorite holiday sweater",
  "Has attended a wedding this year",
  "Loves late-night snacks"
];

const CreateGame = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [gameTitle, setGameTitle] = useState('');
  const [cardSize, setCardSize] = useState<'9' | '25'>('9');
  const [prompts, setPrompts] = useState<string[]>(Array(9).fill(''));
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

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

  const generateRandomPrompts = () => {
    const requiredCount = cardSize === '9' ? 9 : 25;
    const shuffled = [...BINGO_PROMPTS].sort(() => Math.random() - 0.5);
    const selectedPrompts = shuffled.slice(0, requiredCount);
    
    const newPrompts = Array(requiredCount).fill('');
    selectedPrompts.forEach((prompt, index) => {
      newPrompts[index] = prompt;
    });
    
    setPrompts(newPrompts);
    
    toast({
      title: 'Random prompts generated!',
      description: `Generated ${requiredCount} random bingo prompts.`,
    });
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file format',
        description: 'Please select a CSV file.',
      });
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 1 || lines.length > 25) {
        toast({
          variant: 'destructive',
          title: 'Invalid CSV format',
          description: 'CSV must contain between 1 and 25 rows of prompts.',
        });
        return;
      }

      // Parse CSV - handle potential commas in quoted fields, but expect single column
      const parsedPrompts: string[] = [];
      for (const line of lines) {
        // Simple CSV parsing for single column - just trim and use the line
        let prompt = line;
        
        // Remove quotes if the entire line is quoted
        if (prompt.startsWith('"') && prompt.endsWith('"')) {
          prompt = prompt.slice(1, -1);
        }
        
        // Replace escaped quotes
        prompt = prompt.replace(/""/g, '"');
        
        if (prompt.trim()) {
          parsedPrompts.push(prompt.trim());
        }
      }

      if (parsedPrompts.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Empty CSV file',
          description: 'The CSV file contains no valid prompts.',
        });
        return;
      }

      // Update card size if needed based on number of prompts
      const promptCount = parsedPrompts.length;
      let newCardSize: '9' | '25' = '9';
      
      if (promptCount > 9) {
        newCardSize = '25';
      }
      
      // Set card size and prompts
      if (newCardSize !== cardSize) {
        setCardSize(newCardSize);
      }
      
      const newSize = newCardSize === '9' ? 9 : 25;
      const newPrompts = Array(newSize).fill('');
      
      // Fill in the imported prompts
      parsedPrompts.forEach((prompt, index) => {
        if (index < newSize) {
          newPrompts[index] = prompt;
        }
      });
      
      setPrompts(newPrompts);

      toast({
        title: 'CSV imported successfully!',
        description: `Imported ${parsedPrompts.length} prompts. ${newCardSize === '25' ? 'Card size automatically set to 5×5.' : ''}`,
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error importing CSV',
        description: 'Failed to read the CSV file. Please check the file format.',
      });
    } finally {
      setImporting(false);
      // Clear the file input
      event.target.value = '';
    }
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
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="w-full max-w-4xl mx-auto space-y-6">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Label>Bingo Prompts</Label>
                  <span className="text-sm text-muted-foreground">
                    {prompts.filter(p => p.trim()).length} / {requiredPrompts}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRandomPrompts}
                    className="w-full sm:w-auto"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Create Random Prompts
                  </Button>
                  
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                    id="csv-import"
                    disabled={importing}
                  />
                  <label htmlFor="csv-import">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer w-full sm:w-auto"
                      disabled={importing}
                      asChild
                    >
                      <span className="flex items-center gap-2 w-full justify-center sm:justify-start">
                        {importing ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Import from CSV
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
              
              {/* CSV Format Info */}
              <div className="bg-muted/50 border rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">CSV Format Requirements:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Single column with bingo prompts</li>
                      <li>• 1-25 rows (one prompt per row)</li>
                      <li>• No headers required</li>
                      <li>• Card size will auto-adjust for 10+ prompts</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className={`grid ${gridCols} gap-2 sm:gap-3`}>
                {prompts.map((prompt, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Square {index + 1}
                    </Label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => updatePrompt(index, e.target.value)}
                      placeholder="Enter prompt..."
                      className="min-h-[60px] sm:min-h-[80px] text-sm"
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