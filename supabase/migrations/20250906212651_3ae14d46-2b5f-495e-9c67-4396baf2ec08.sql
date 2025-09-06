-- Create games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  card_size INTEGER NOT NULL CHECK (card_size IN (9, 25)),
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create bingo_items table (the prompts for each square)
CREATE TABLE public.bingo_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0 AND position < 25),
  text_prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, position)
);

-- Create players table (people who join games)
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_time TIMESTAMP WITH TIME ZONE,
  is_winner BOOLEAN NOT NULL DEFAULT false
);

-- Create player_progress table (tracking completed items)
CREATE TABLE public.player_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  bingo_item_id UUID NOT NULL REFERENCES public.bingo_items(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  photo_url TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_id, bingo_item_id)
);

-- Enable RLS on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bingo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Hosts can manage their games" ON public.games
FOR ALL USING (auth.uid() = host_id);

CREATE POLICY "Anyone can view games with invite code" ON public.games
FOR SELECT USING (true);

-- Bingo items policies  
CREATE POLICY "Hosts can manage bingo items for their games" ON public.bingo_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.games 
    WHERE games.id = bingo_items.game_id 
    AND games.host_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view bingo items for public games" ON public.bingo_items
FOR SELECT USING (true);

-- Players policies
CREATE POLICY "Anyone can join games as players" ON public.players
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view players in games" ON public.players
FOR SELECT USING (true);

CREATE POLICY "Players can update their own data" ON public.players
FOR UPDATE USING (true);

-- Player progress policies
CREATE POLICY "Players can manage their progress" ON public.player_progress
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.players
    WHERE players.id = player_progress.player_id
  )
);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bingo-photos', 'bingo-photos', true);

-- Storage policies for bingo photos
CREATE POLICY "Anyone can upload bingo photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'bingo-photos');

CREATE POLICY "Anyone can view bingo photos" ON storage.objects
FOR SELECT USING (bucket_id = 'bingo-photos');

CREATE POLICY "Players can update their photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'bingo-photos');

-- Create function to generate unique invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_games_invite_code ON public.games(invite_code);
CREATE INDEX idx_games_host_id ON public.games(host_id);
CREATE INDEX idx_bingo_items_game_id ON public.bingo_items(game_id);
CREATE INDEX idx_players_game_id ON public.players(game_id);
CREATE INDEX idx_player_progress_player_id ON public.player_progress(player_id);