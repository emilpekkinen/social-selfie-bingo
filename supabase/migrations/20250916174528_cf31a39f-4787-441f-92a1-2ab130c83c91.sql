-- Update RLS policies to support guest players properly

-- Drop existing conflicting policies on players table
DROP POLICY IF EXISTS "Users can insert their own player record" ON public.players;
DROP POLICY IF EXISTS "Users can update their own player record" ON public.players;
DROP POLICY IF EXISTS "Game members and hosts can view players" ON public.players;

-- Create new policies that support both authenticated and guest players
CREATE POLICY "Players can insert records for themselves or as guests"
ON public.players
FOR INSERT
WITH CHECK (
  -- Authenticated users can only insert with their own user_id
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  -- Guest players can insert with null user_id
  (auth.uid() IS NULL AND user_id IS NULL)
);

CREATE POLICY "Players can update their own records"
ON public.players
FOR UPDATE
USING (
  -- Authenticated users can update their own records
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  -- Guest players can update records with null user_id (we'll use player_id for identification)
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Update player_progress policies to work with guest players
DROP POLICY IF EXISTS "Players can manage their own progress" ON public.player_progress;

CREATE POLICY "Players can manage their own progress"
ON public.player_progress
FOR ALL
USING (
  -- For authenticated users, check user ownership through players table
  (EXISTS (
    SELECT 1 FROM public.players 
    WHERE players.id = player_progress.player_id 
    AND players.user_id = auth.uid()
  )) OR
  -- For guests, we'll rely on the player_id being passed correctly from the frontend
  -- (this is less secure but necessary for guest functionality)
  (EXISTS (
    SELECT 1 FROM public.players 
    WHERE players.id = player_progress.player_id 
    AND players.user_id IS NULL
  ))
);

-- Create a storage bucket for bingo photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bingo-photos', 'bingo-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies that only allow authenticated users to upload photos
DROP POLICY IF EXISTS "Only authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Only authenticated users can upload photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'bingo-photos' AND
  auth.uid() IS NOT NULL
);