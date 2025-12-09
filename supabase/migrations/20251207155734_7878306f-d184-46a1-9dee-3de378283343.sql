-- Drop existing permissive SELECT policy on team_invitations
DROP POLICY IF EXISTS "Team members can view invitations" ON public.team_invitations;

-- Create restrictive SELECT policy that only allows owners/admins OR the invited person to see invitations
CREATE POLICY "Only admins and invited users can view invitations" 
ON public.team_invitations 
FOR SELECT 
USING (
  get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);