import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useContentPlanner, PostDraft } from '@/hooks/useContentPlanner';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { BestTimeToPost, HashtagSuggestions } from '@/components/schedule/PostAnalytics';
import { MediaUpload } from '@/components/schedule/MediaUpload';
import { PostPreviewTabs } from '@/components/schedule/PostPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, FileText, Trash2, Edit, Clock, Instagram, Loader2, Save, Send, Youtube, CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { cn } from '@/lib/utils';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const ContentPlanner = () => {
  const { drafts, loading, createDraft, updateDraft, deleteDraft } = useContentPlanner();
  const { accounts } = useSocialAccounts();
  const { createPost } = useScheduledPosts();
  
  const allAccounts = accounts.filter(a => ['instagram', 'tiktok', 'youtube'].includes(a.platform));

  const [activeTab, setActiveTab] = useState<'drafts' | 'insights'>('drafts');
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<PostDraft | null>(null);
  const [schedulingDraft, setSchedulingDraft] = useState<PostDraft | null>(null);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");
  
  const [draftForm, setDraftForm] = useState({ 
    account_id: '', 
    platform: '' as 'instagram' | 'tiktok' | 'youtube' | '', 
    content: '', 
    media_urls: [] as string[], 
    media_type: 'image', 
    hashtags: [] as string[], 
    notes: '',
    template_id: null as string | null,
  });
  
  const [scheduleForm, setScheduleForm] = useState({
    account_id: '',
    scheduled_date: undefined as Date | undefined,
    scheduled_time: '12:00',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Entwürfe nach Account filtern
  const filteredDrafts = useMemo(() => {
    if (selectedAccountFilter === "all") return drafts;
    return drafts.filter(d => d.account_id === selectedAccountFilter || d.platform === accounts.find(a => a.id === selectedAccountFilter)?.platform);
  }, [drafts, selectedAccountFilter, accounts]);

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    if (editingDraft) await updateDraft(editingDraft.id, draftForm);
    else await createDraft(draftForm);
    setIsDraftDialogOpen(false);
    resetDraftForm();
    setIsSubmitting(false);
  };

  const resetDraftForm = () => {
    setDraftForm({ account_id: '', platform: '', content: '', media_urls: [], media_type: 'image', hashtags: [], notes: '', template_id: null });
    setEditingDraft(null);
  };

  const openEditDraft = (draft: PostDraft) => {
    setDraftForm({
      account_id: draft.account_id || '', 
      platform: (draft.platform as 'instagram' | 'tiktok' | 'youtube' | '') || '', 
      content: draft.content || '', 
      media_urls: draft.media_urls || [], 
      media_type: draft.media_type || 'image', 
      hashtags: draft.hashtags || [], 
      notes: draft.notes || '',
      template_id: draft.template_id || null,
    });
    setEditingDraft(draft);
    setIsDraftDialogOpen(true);
  };

  const openScheduleDraft = (draft: PostDraft) => {
    setSchedulingDraft(draft);
    setScheduleForm({
      account_id: draft.account_id || '',
      scheduled_date: undefined,
      scheduled_time: '12:00',
    });
    setIsScheduleDialogOpen(true);
  };

  const handleSchedulePost = async () => {
    if (!schedulingDraft || !scheduleForm.scheduled_date || !scheduleForm.account_id) {
      toast.error('Bitte fülle alle Felder aus');
      return;
    }

    setIsSubmitting(true);
    
    const scheduledFor = new Date(scheduleForm.scheduled_date);
    const [hours, minutes] = scheduleForm.scheduled_time.split(':').map(Number);
    scheduledFor.setHours(hours, minutes, 0, 0);

    const account = allAccounts.find(a => a.id === scheduleForm.account_id);
    const platform = (account?.platform || schedulingDraft.platform || 'instagram') as 'instagram' | 'tiktok' | 'youtube';
    
    // Content mit Hashtags zusammenführen
    let finalContent = schedulingDraft.content || '';
    if (schedulingDraft.hashtags && schedulingDraft.hashtags.length > 0) {
      finalContent += '\n\n' + schedulingDraft.hashtags.map(h => `#${h}`).join(' ');
    }

    const result = await createPost({
      account_id: scheduleForm.account_id,
      platform: platform,
      content: finalContent,
      media_urls: schedulingDraft.media_urls || [],
      media_type: (schedulingDraft.media_urls?.length || 0) > 1 ? 'carousel' : (schedulingDraft.media_type as any) || 'image',
      scheduled_for: scheduledFor.toISOString(),
    });

    if (result) {
      // Optional: Entwurf nach erfolgreicher Planung löschen
      await deleteDraft(schedulingDraft.id);
      toast.success('Post erfolgreich geplant!');
      setIsScheduleDialogOpen(false);
      setSchedulingDraft(null);
    }
    
    setIsSubmitting(false);
  };

  if (loading) return <DashboardLayout><div className="p-8"><Skeleton className="h-10 w-48 mb-8" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Content Planer</h1>
            <p className="text-muted-foreground">Entwürfe und Insights</p>
          </div>
          
          {/* Account Filter */}
          <div className="flex items-center gap-3">
            <Select value={selectedAccountFilter} onValueChange={setSelectedAccountFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground"/>
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Accounts</SelectItem>
                {allAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.platform === 'instagram' ? '📸' : acc.platform === 'youtube' ? '📺' : '🎵'} @{acc.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="drafts"><FileText className="w-4 h-4 mr-1" /> Entwürfe ({filteredDrafts.length})</TabsTrigger>
            <TabsTrigger value="insights"><Clock className="w-4 h-4 mr-1" /> Beste Zeiten</TabsTrigger>
          </TabsList>

          <TabsContent value="drafts">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { resetDraftForm(); setIsDraftDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Neuer Entwurf
              </Button>
            </div>
            
            {filteredDrafts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Entwürfe</h3>
                  <p className="text-muted-foreground mb-4">Erstelle deinen ersten Entwurf, um Content vorzubereiten.</p>
                  <Button onClick={() => { resetDraftForm(); setIsDraftDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Entwurf erstellen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDrafts.map((draft) => (
                  <Card key={draft.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary">
                          {draft.platform === 'youtube' ? <Youtube className="w-3 h-3 mr-1"/> : draft.platform === 'tiktok' ? <TikTokIcon className="w-3 h-3 mr-1"/> : <Instagram className="w-3 h-3 mr-1"/>}
                          {draft.platform || 'Keine Plattform'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(draft.updated_at || new Date()), 'dd.MM.yy', { locale: de })}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {draft.media_urls && draft.media_urls.length > 0 && (
                        <div className="mb-3 rounded-lg overflow-hidden">
                          <img src={draft.media_urls[0]} alt="Preview" className="w-full h-32 object-cover" />
                        </div>
                      )}
                      <p className="text-sm line-clamp-3 mb-2">{draft.content || 'Kein Inhalt'}</p>
                      {draft.hashtags && draft.hashtags.length > 0 && (
                        <p className="text-xs text-primary mb-3 line-clamp-1">
                          {draft.hashtags.slice(0, 5).map(h => `#${h}`).join(' ')}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDraft(draft)}>
                          <Edit className="w-3 h-3 mr-1"/> Bearbeiten
                        </Button>
                        <Button size="sm" onClick={() => openScheduleDraft(draft)}>
                          <Send className="w-3 h-3 mr-1"/> Planen
                        </Button>
                        <Button size="icon" variant="ghost" className="ml-auto text-destructive" onClick={() => deleteDraft(draft.id)}>
                          <Trash2 className="w-4 h-4"/>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid gap-6 lg:grid-cols-3">
              <BestTimeToPost platform="instagram" />
              <BestTimeToPost platform="tiktok" />
              <BestTimeToPost platform="youtube" />
            </div>
          </TabsContent>
        </Tabs>

        {/* Draft Dialog */}
        <Dialog open={isDraftDialogOpen} onOpenChange={(open) => { setIsDraftDialogOpen(open); if (!open) resetDraftForm(); }}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingDraft ? 'Entwurf bearbeiten' : 'Neuer Entwurf'}</DialogTitle>
              <DialogDescription>Erstelle oder bearbeite deinen Content-Entwurf</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScrollArea className="h-[55vh] pr-4">
                <div className="space-y-4">
                  <div>
                    <Label>Plattform</Label>
                    <Select value={draftForm.platform} onValueChange={(v) => setDraftForm(prev => ({ ...prev, platform: v as '' | 'instagram' | 'tiktok' | 'youtube' }))}>
                      <SelectTrigger><SelectValue placeholder="Plattform wählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">📸 Instagram</SelectItem>
                        <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                        <SelectItem value="youtube">📺 YouTube</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Inhalt</Label>
                    <Textarea 
                      value={draftForm.content} 
                      onChange={(e) => setDraftForm(prev => ({ ...prev, content: e.target.value }))} 
                      placeholder="Schreibe deinen Post..." 
                      rows={5} 
                    />
                  </div>
                  
                  <div>
                    <Label>Hashtags</Label>
                    <Input 
                      value={draftForm.hashtags.join(' ')} 
                      onChange={(e) => setDraftForm(prev => ({ 
                        ...prev, 
                        hashtags: e.target.value.split(' ').filter(h => h.trim()).map(h => h.replace('#', ''))
                      }))} 
                      placeholder="#hashtag1 #hashtag2 #hashtag3"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Hashtags mit Leerzeichen getrennt eingeben</p>
                  </div>
                  
                  <div>
                    <Label>Medien</Label>
                    <MediaUpload 
                      onUpload={(urls) => setDraftForm(prev => ({ ...prev, media_urls: [...prev.media_urls, ...urls] }))} 
                      uploadedUrls={draftForm.media_urls} 
                      onRemove={(url) => setDraftForm(prev => ({ ...prev, media_urls: prev.media_urls.filter(u => u !== url) }))} 
                    />
                  </div>
                </div>
              </ScrollArea>
              
              <div className="space-y-4">
                <HashtagSuggestions 
                  content={draftForm.content} 
                  platform={(draftForm.platform || 'instagram') as any} 
                  selectedHashtags={draftForm.hashtags} 
                  onSelect={(tags) => setDraftForm(prev => ({ ...prev, hashtags: tags }))} 
                />
                
                {draftForm.platform && draftForm.media_urls.length > 0 && (
                  <PostPreviewTabs
                    platform={draftForm.platform as any}
                    username="preview"
                    content={draftForm.content + (draftForm.hashtags.length > 0 ? '\n\n' + draftForm.hashtags.map(h => `#${h}`).join(' ') : '')}
                    mediaUrls={draftForm.media_urls}
                    mediaType={draftForm.media_type as any}
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDraftDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={handleSaveDraft} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4"/>} 
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog - NEU: Direktes Planen aus Entwurf */}
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Post planen</DialogTitle>
              <DialogDescription>Wähle Account, Datum und Uhrzeit für deinen Post</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label>Account</Label>
                <Select value={scheduleForm.account_id} onValueChange={(v) => setScheduleForm(prev => ({ ...prev, account_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Account wählen" /></SelectTrigger>
                  <SelectContent>
                    {allAccounts
                      .filter(a => !schedulingDraft?.platform || a.platform === schedulingDraft.platform)
                      .map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.platform === 'instagram' ? '📸' : acc.platform === 'youtube' ? '📺' : '🎵'} @{acc.username}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Datum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !scheduleForm.scheduled_date && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduleForm.scheduled_date ? format(scheduleForm.scheduled_date, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar 
                        mode="single" 
                        selected={scheduleForm.scheduled_date} 
                        onSelect={(date) => setScheduleForm(prev => ({ ...prev, scheduled_date: date }))} 
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>Uhrzeit</Label>
                  <Select value={scheduleForm.scheduled_time} onValueChange={(v) => setScheduleForm(prev => ({ ...prev, scheduled_time: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 * 4 }).map((_, i) => {
                        const h = Math.floor(i / 4);
                        const m = (i % 4) * 15;
                        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                        return <SelectItem key={time} value={time}>{time}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Vorschau */}
              {schedulingDraft && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium mb-2">Post-Vorschau:</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{schedulingDraft.content || 'Kein Inhalt'}</p>
                  {schedulingDraft.hashtags && schedulingDraft.hashtags.length > 0 && (
                    <p className="text-xs text-primary mt-2">{schedulingDraft.hashtags.map(h => `#${h}`).join(' ')}</p>
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Abbrechen</Button>
              <Button 
                onClick={handleSchedulePost} 
                disabled={isSubmitting || !scheduleForm.account_id || !scheduleForm.scheduled_date}
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <CalendarIcon className="mr-2 h-4 w-4"/>}
                Planen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ContentPlanner;
