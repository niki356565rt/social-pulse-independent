import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useSubscription } from '@/hooks/useSubscription';
import { useCompetitors } from '@/hooks/useCompetitors';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { supabase } from '@/integrations/supabase/client'; // Supabase Client
import { Lock, Plus, Trash2, ExternalLink, Users, TrendingUp, Instagram, Youtube, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: TrendingUp,
};

const Competitors = () => {
  const { canAccess } = useSubscription();
  const { competitors, loading, addCompetitor, removeCompetitor, refreshCompetitors } = useCompetitors(); // refreshCompetitors angenommen, sonst reload
  const { stats } = useDashboardMetrics();
  const navigate = useNavigate();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    platform: 'instagram',
    username: '',
    displayName: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // State für Refresh Button

  const hasAccess = canAccess('competitorBenchmark');

  // Funktion zum Abrufen neuer Daten (ruft Edge Function auf)
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-competitor-metrics');
      
      if (error) throw error;
      
      toast.success('Wettbewerber-Daten aktualisiert!');
      // Wenn der Hook eine refresh-Methode hat, rufen wir sie auf, sonst Page reload
      if (refreshCompetitors) {
        await refreshCompetitors();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Refresh error:', error);
      toast.error('Fehler beim Aktualisieren: ' + error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitor.username.trim()) {
      toast.error('Bitte gib einen Benutzernamen ein');
      return;
    }

    setIsAdding(true);
    const success = await addCompetitor(
      newCompetitor.platform,
      newCompetitor.username,
      newCompetitor.displayName || undefined
    );
    setIsAdding(false);

    if (success) {
      setIsDialogOpen(false);
      setNewCompetitor({ platform: 'instagram', username: '', displayName: '' });
      // Optional: Direkt Daten abrufen nach Hinzufügen
      toast.info('Wettbewerber hinzugefügt. Klicke "Daten aktualisieren" um Metriken zu laden.');
    }
  };

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Konkurrenz-Tracker</h1>
            <p className="text-muted-foreground mb-8">
              Verfolge deine Konkurrenten und vergleiche deine Performance mit anderen Accounts.
              Dieses Feature ist nur für B2B/Agenturen-User verfügbar.
            </p>
            <Button onClick={() => navigate('/subscription')}>
              Auf B2B upgraden
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Konkurrenz-Tracker</h1>
            <p className="text-muted-foreground">
              Verfolge und vergleiche deine Performance mit der Konkurrenz.
            </p>
          </div>
          <div className="flex gap-2">
            {/* Refresh Button Hinzugefügt */}
            <Button variant="outline" onClick={handleRefreshData} disabled={isRefreshing || competitors.length === 0}>
              {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Daten aktualisieren
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Konkurrent hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Konkurrenten hinzufügen</DialogTitle>
                  <DialogDescription>
                    Füge einen Social Media Account hinzu, den du verfolgen möchtest.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Plattform</Label>
                    <Select 
                      value={newCompetitor.platform} 
                      onValueChange={(value) => setNewCompetitor(prev => ({ ...prev, platform: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        {/* YouTube entfernt, da der Scraper aktuell auf IG/TikTok ausgelegt ist in der Edge Function */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Benutzername (ohne @)</Label>
                    <Input
                      placeholder="username"
                      value={newCompetitor.username}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Anzeigename (optional)</Label>
                    <Input
                      placeholder="z.B. Konkurrent A"
                      value={newCompetitor.displayName}
                      onChange={(e) => setNewCompetitor(prev => ({ ...prev, displayName: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleAddCompetitor} disabled={isAdding}>
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hinzufügen'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Your Stats Summary */}
        <Card className="mb-8 border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">Deine Performance</CardTitle>
            <CardDescription>Vergleiche mit deinen Konkurrenten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold">{stats.totalFollowers.toLocaleString('de-DE')}</p>
                <p className="text-sm text-muted-foreground">Follower</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold">{stats.engagementRate}%</p>
                <p className="text-sm text-muted-foreground">Engagement</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold">{stats.totalImpressions.toLocaleString('de-DE')}</p>
                <p className="text-sm text-muted-foreground">Impressions</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold">{stats.totalReach.toLocaleString('de-DE')}</p>
                <p className="text-sm text-muted-foreground">Reichweite</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitors List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : competitors.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Konkurrenten</h3>
              <p className="text-muted-foreground mb-4">
                Füge Konkurrenten hinzu, um ihre Performance zu verfolgen.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Konkurrenten hinzufügen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {competitors.map((competitor) => {
              const PlatformIcon = platformIcons[competitor.platform] || Users;
              const metrics = competitor.latestMetrics;
              
              return (
                <Card key={competitor.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <PlatformIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {competitor.display_name || competitor.username}
                            </h3>
                            <Badge variant="outline" className="capitalize">
                              {competitor.platform}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">@{competitor.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {metrics ? (
                          <div className="flex gap-6 text-center">
                            <div>
                              <p className="text-lg font-semibold">
                                {metrics.followers_count.toLocaleString('de-DE')}
                              </p>
                              <p className="text-xs text-muted-foreground">Follower</p>
                            </div>
                            <div>
                              <p className="text-lg font-semibold">
                                {metrics.posts_count?.toLocaleString('de-DE') || '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">Posts</p>
                            </div>
                            <div>
                              <p className="text-lg font-semibold">
                                {metrics.engagement_rate ? `${metrics.engagement_rate}%` : '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">Engagement</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            Keine Daten (Klicke oben auf "Aktualisieren")
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {competitor.profile_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(competitor.profile_url!, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompetitor(competitor.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Competitors;