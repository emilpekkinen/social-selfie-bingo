-- Add RLS policy to allow players to view all progress in games they participate in
CREATE POLICY "Game members can view all progress in their games" 
ON public.player_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.players p1
    JOIN public.players p2 ON p1.game_id = p2.game_id
    WHERE p1.user_id = auth.uid() 
    AND p2.id = player_progress.player_id
  )
);