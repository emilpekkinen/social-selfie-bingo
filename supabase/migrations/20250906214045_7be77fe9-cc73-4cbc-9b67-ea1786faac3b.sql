-- Phase 1: Critical Security Fixes - Skip existing trigger

-- Step 1: Add user_id to players table first
ALTER TABLE public.players ADD COLUMN user_id uuid;

-- Step 2: Add security definer helper functions
CREATE OR REPLACE FUNCTION public.is_game_host(_game_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.games g 
    WHERE g.id = _game_id AND g.host_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_game(_game_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players p 
    WHERE p.game_id = _game_id AND p.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_player(_player_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players p 
    WHERE p.id = _player_id AND p.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_host_of_progress(_player_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players p
    JOIN public.games g ON g.id = p.game_id
    WHERE p.id = _player_id AND g.host_id = auth.uid()
  );
$$;

-- Step 3: Create secure RPC function for public game access
CREATE OR REPLACE FUNCTION public.get_public_game(invite_code text)
RETURNS TABLE (
  id uuid,
  title text,
  card_size integer,
  status text,
  player_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    g.id,
    g.title,
    g.card_size,
    g.status,
    COALESCE((SELECT COUNT(*) FROM public.players p WHERE p.game_id = g.id), 0) as player_count
  FROM public.games g
  WHERE g.invite_code = $1;
$$;

-- Step 4: Drop existing overly permissive policies
DROP POLICY IF EXISTS "Players can update their own data" ON public.players;
DROP POLICY IF EXISTS "Players can manage their progress" ON public.player_progress;
DROP POLICY IF EXISTS "Anyone can view games with invite code" ON public.games;
DROP POLICY IF EXISTS "Anyone can view bingo items for public games" ON public.bingo_items;

-- Step 5: Create secure RLS policies for players table
CREATE POLICY "Users can insert their own player record"
ON public.players
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player record"
ON public.players
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Game members and hosts can view players"
ON public.players
FOR SELECT
USING (public.is_game_host(game_id) OR public.is_member_of_game(game_id));

-- Step 6: Create secure RLS policies for player_progress table
CREATE POLICY "Players can manage their own progress"
ON public.player_progress
FOR ALL
USING (public.owns_player(player_id));

CREATE POLICY "Hosts can view player progress in their games"
ON public.player_progress
FOR SELECT
USING (public.is_host_of_progress(player_id));

-- Step 7: Create secure RLS policies for games table
CREATE POLICY "Game members can view their games"
ON public.games
FOR SELECT
USING (public.is_member_of_game(id));

-- Step 8: Create secure RLS policies for bingo_items table
CREATE POLICY "Game members and hosts can view bingo items"
ON public.bingo_items
FOR SELECT
USING (public.is_game_host(game_id) OR public.is_member_of_game(game_id));

-- Step 9: Add unique constraint to prevent duplicate players per game
ALTER TABLE public.players ADD CONSTRAINT unique_user_per_game UNIQUE (game_id, user_id);