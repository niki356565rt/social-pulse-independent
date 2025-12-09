-- Fix RLS policy for teams to allow owners to see their teams immediately after creation
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;

CREATE POLICY "Team members and owners can view their teams"
ON public.teams
FOR SELECT
USING (owner_id = auth.uid() OR is_team_member(auth.uid(), id));