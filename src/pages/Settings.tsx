import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  Trash2,
  Check,
  Crown,
  Loader2,
  Lock,
  Pencil,
  Upload
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { user } = useAuth();
  const { plan, canAccess, openCustomerPortal } = useSubscription();
  const { settings, loading, saving, saveSettings } = useNotificationSettings();
  const canUseAlerts = canAccess('alerts');
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [thresholdPercent, setThresholdPercent] = useState(5);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.email_notifications);
      setThresholdPercent(settings.threshold_percent);
    }
  }, [settings]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        if (data.full_name) setProfileName(data.full_name);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    };
    loadProfile();
  }, [user]);

  const handleSaveNotifications = () => {
    saveSettings(emailNotifications, thresholdPercent);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profileName })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success('Profil gespeichert');
      setIsProfileDialogOpen(false);
    } catch (error: any) {
      toast.error('Fehler beim Speichern');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (event: any) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      setUploadingAvatar(true);

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Profilbild aktualisiert!');
    } catch (error: any) {
      toast.error('Fehler beim Upload: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const initials = user?.email?.substring(0, 2).toUpperCase() || 'U';
  const displayName = profileName || user?.email?.split('@')[0] || 'Benutzer';

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Einstellungen</h1>
          <p className="text-muted-foreground">Verwalte dein Konto und deine Einstellungen</p>
        </div>

        {/* Profile Section */}
        <section className="kpi-card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Profil</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-border">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <label htmlFor="avatar-upload" className="cursor-pointer p-2">
                    {uploadingAvatar ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Upload className="w-6 h-6 text-white" />}
                  </label>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{displayName}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsProfileDialogOpen(true)} className="h-8 w-8">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Klicke auf das Bild zum Ändern</p>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Edit Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Profil bearbeiten</DialogTitle>
              <DialogDescription>Ändere deinen Anzeigenamen</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Dein Name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subscription Section */}
        <section className="kpi-card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Abo-Status</h2>
          </div>
          
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold capitalize">{plan} Plan</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {plan === 'free' ? 'Kostenlos' : plan === 'pro' ? '9€/Monat' : plan === 'premium' ? '19€/Monat' : '49€/Monat'}
            </p>
            <div className="flex flex-wrap gap-2">
              {plan === 'free' && ["1 Account", "7 Tage Historie"].map(f => <Badge key={f} variant="secondary" className="bg-primary/10 text-primary"><Check className="w-3 h-3 mr-1"/>{f}</Badge>)}
              {plan === 'pro' && ["5 Accounts", "30 Tage Historie", "CSV"].map(f => <Badge key={f} variant="secondary" className="bg-primary/10 text-primary"><Check className="w-3 h-3 mr-1"/>{f}</Badge>)}
              {plan === 'premium' && ["20 Accounts", "90 Tage", "AI Insights"].map(f => <Badge key={f} variant="secondary" className="bg-primary/10 text-primary"><Check className="w-3 h-3 mr-1"/>{f}</Badge>)}
            </div>
          </div>
          
          <div className="flex gap-2">
            {plan !== 'b2b' && (
              <Link to="/subscription"><Button variant="gradient" size="sm">{plan === 'free' ? 'Upgrade' : 'Plan ändern'}</Button></Link>
            )}
            {plan !== 'free' && <Button variant="outline" size="sm" onClick={openCustomerPortal}>Abo verwalten</Button>}
          </div>
        </section>

        {/* Notifications Section */}
        <section className="kpi-card mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Benachrichtigungen</h2>
            </div>
            {!canUseAlerts && <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium flex items-center gap-1"><Lock className="w-3 h-3" /> Premium</span>}
          </div>
          
          {!canUseAlerts ? (
            <div className="text-center py-8">
              <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">Premium-Feature</h3>
              <p className="text-sm text-muted-foreground mb-4">Email-Alerts bei Follower-Änderungen sind ab dem Premium-Plan verfügbar.</p>
              <Link to="/subscription"><Button variant="gradient" size="sm"><Crown className="w-4 h-4 mr-2" /> Upgrade auf Premium</Button></Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="text-sm font-medium">E-Mail-Benachrichtigungen</Label>
                  <p className="text-xs text-muted-foreground">Erhalte Alerts bei signifikanten Follower-Änderungen</p>
                </div>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold" className="text-sm font-medium">Schwellenwert</Label>
                <div className="flex items-center gap-3">
                  <Input id="threshold" type="number" min={1} max={50} value={thresholdPercent} onChange={(e) => setThresholdPercent(Number(e.target.value))} className="w-24" disabled={!emailNotifications} />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Button onClick={handleSaveNotifications} disabled={saving} size="sm">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Speichern...</> : 'Einstellungen speichern'}</Button>
            </div>
          )}
        </section>

        <section className="kpi-card border-destructive/30">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Gefahrenzone</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Das Löschen deines Kontos ist permanent.</p>
          <Button variant="destructive" size="sm">Konto löschen</Button>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Settings;