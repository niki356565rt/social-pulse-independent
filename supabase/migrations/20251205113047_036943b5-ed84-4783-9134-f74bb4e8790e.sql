-- Ensure pgcrypto is installed in the extensions schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Create enum for team roles
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create team members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  -- FIX: Use extensions.gen_random_bytes explicitly
  token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Helper function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- Helper function to check team role
CREATE OR REPLACE FUNCTION public.get_team_role(_user_id UUID, _team_id UUID)
RETURNS team_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.team_members
  WHERE user_id = _user_id AND team_id = _team_id
$$;

-- Teams policies
CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
USING (public.is_team_member(auth.uid(), id));

CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners and admins can update teams"
ON public.teams FOR UPDATE
USING (public.get_team_role(auth.uid(), id) IN ('owner', 'admin'));

CREATE POLICY "Only team owners can delete teams"
ON public.teams FOR DELETE
USING (auth.uid() = owner_id);

-- Team members policies
CREATE POLICY "Team members can view other members"
ON public.team_members FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team owners and admins can add members"
ON public.team_members FOR INSERT
WITH CHECK (public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin'));

CREATE POLICY "Team owners and admins can update members"
ON public.team_members FOR UPDATE
USING (public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin'));

CREATE POLICY "Team owners and admins can remove members"
ON public.team_members FOR DELETE
USING (public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin') OR auth.uid() = user_id);

-- Team invitations policies
CREATE POLICY "Team members can view invitations"
ON public.team_invitations FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team owners and admins can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin'));

CREATE POLICY "Team owners and admins can delete invitations"
ON public.team_invitations FOR DELETE
USING (public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-add owner as team member
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();