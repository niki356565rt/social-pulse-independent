import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
  profile?: {
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export const useTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<TeamRole | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams((data as Team[]) || []);
      
      // Set first team as current if none selected
      if (data && data.length > 0 && !currentTeam) {
        setCurrentTeam(data[0] as Team);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentTeam]);

  const fetchTeamMembers = useCallback(async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profile:profiles(email, full_name, avatar_url)
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      
      const formattedMembers = (data || []).map(member => ({
        ...member,
        profile: Array.isArray(member.profile) ? member.profile[0] : member.profile
      })) as TeamMember[];
      
      setMembers(formattedMembers);
      
      // Set my role
      const myMembership = formattedMembers.find(m => m.user_id === user?.id);
      setMyRole(myMembership?.role || null);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  }, [user?.id]);

  const fetchInvitations = useCallback(async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .is('accepted_at', null);

      if (error) throw error;
      setInvitations((data as TeamInvitation[]) || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (currentTeam) {
      fetchTeamMembers(currentTeam.id);
      fetchInvitations(currentTeam.id);
    }
  }, [currentTeam, fetchTeamMembers, fetchInvitations]);

  const createTeam = async (name: string) => {
    if (!user) return null;

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    try {
      console.log('[TEAMS] Creating team:', { name, slug, owner_id: user.id });
      
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name,
          slug: `${slug}-${Date.now()}`,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('[TEAMS] Insert error:', error);
        throw error;
      }
      
      console.log('[TEAMS] Team created successfully:', data);
      
      // Wait a moment for the trigger to create the team_member entry
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Team erfolgreich erstellt');
      await fetchTeams();
      setCurrentTeam(data as Team);
      return data as Team;
    } catch (error: any) {
      console.error('[TEAMS] Error creating team:', error);
      console.error('[TEAMS] Error code:', error.code);
      console.error('[TEAMS] Error message:', error.message);
      console.error('[TEAMS] Error details:', error.details);
      toast.error(`Fehler beim Erstellen des Teams: ${error.message || 'Unbekannter Fehler'}`);
      return null;
    }
  };

  const inviteMember = async (email: string, role: TeamRole = 'member') => {
    if (!currentTeam || !user) return false;

    try {
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: currentTeam.id,
          email,
          role,
          invited_by: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Diese E-Mail wurde bereits eingeladen');
        } else {
          throw error;
        }
        return false;
      }

      toast.success(`Einladung an ${email} gesendet`);
      await fetchInvitations(currentTeam.id);
      return true;
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Fehler beim Einladen');
      return false;
    }
  };

  const updateMemberRole = async (memberId: string, newRole: TeamRole) => {
    if (!currentTeam) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Rolle aktualisiert');
      await fetchTeamMembers(currentTeam.id);
      return true;
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Fehler beim Aktualisieren der Rolle');
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!currentTeam) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Mitglied entfernt');
      await fetchTeamMembers(currentTeam.id);
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Fehler beim Entfernen des Mitglieds');
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!currentTeam) return false;

    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Einladung zurückgezogen');
      await fetchInvitations(currentTeam.id);
      return true;
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast.error('Fehler beim Zurückziehen der Einladung');
      return false;
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast.success('Team gelöscht');
      setCurrentTeam(null);
      await fetchTeams();
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Fehler beim Löschen des Teams');
      return false;
    }
  };

  const canManageTeam = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner';

  return {
    teams,
    currentTeam,
    setCurrentTeam,
    members,
    invitations,
    loading,
    myRole,
    canManageTeam,
    isOwner,
    createTeam,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    deleteTeam,
    refetch: fetchTeams
  };
};
