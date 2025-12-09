import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useContentPlanner, ContentTemplate, PostDraft } from '@/hooks/useContentPlanner';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { BestTimeToPost } from '@/components/schedule/PostAnalytics'; // Import angepasst
import { HashtagSuggestions } from '@/components/schedule/PostAnalytics'; // Import angepasst
import { MediaUpload } from '@/components/schedule/MediaUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, FileText, Layout, Trash2, Edit, Clock, Instagram, Loader2, Save, Send, Youtube } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const ContentPlanner = () => {
  const navigate = useNavigate();
  const { templates, drafts, loading, createTemplate, updateTemplate, deleteTemplate, createDraft, updateDraft, deleteDraft } = useContentPlanner();
  const { accounts } = useSocialAccounts();
  
  // YouTube erlauben!
  const allAccounts = accounts.filter(a => ['instagram', 'tiktok', 'youtube'].includes(a.platform));

  const [activeTab, setActiveTab] = useState<'drafts' | 'templates' | 'insights'>('drafts');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [editingDraft, setEditingDraft] = useState<PostDraft | null>(null);
  
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', platform: 'instagram', content: '', hashtags: [] as string[], category: '', media_type: 'image' });
  const [draftForm, setDraftForm] = useState({ account_id: '', platform: '', content: '', media_urls: [] as string[], media_type: 'image', hashtags: [] as string[], template_id: null, notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    if (editingDraft) await updateDraft(editingDraft.id, draftForm);
    else await createDraft(draftForm);
    setIsDraftDialogOpen(false);
    setIsSubmitting(false);
  };

  const openEditDraft = (draft: PostDraft) => {
    setDraftForm({
      account_id: draft.account_id || '', platform: draft.platform || '', content: draft.content || '', media_urls: draft.media_urls || [], media_type: draft.media_type || 'image', hashtags: draft.hashtags || [], template_id: draft.template_id || null, notes: draft.notes || '',
    });
    setEditingDraft(draft);
    setIsDraftDialogOpen(true);
  };

  if (loading) return <DashboardLayout><div className="p-8"><Skeleton className="h-10 w-48 mb-8" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold mb-1">Content Planer</h1><p className="text-muted-foreground">Entwürfe und Insights</p></div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="drafts"><FileText className="w-4 h-4 mr-1" /> Entwürfe</TabsTrigger>
            <TabsTrigger value="insights"><Clock className="w-4 h-4 mr-1" /> Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="drafts">
            <div className="flex justify-end mb-4"><Button onClick={() => setIsDraftDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Neuer Entwurf</Button></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {drafts.map((draft) => (
                 <Card key={draft.id}>
                   <CardHeader className="pb-2">
                     <div className="flex justify-between">
                       <Badge variant="secondary">
                         {draft.platform === 'youtube' ? <Youtube className="w-3 h-3 mr-1"/> : draft.platform === 'tiktok' ? <TikTokIcon className="w-3 h-3 mr-1"/> : <Instagram className="w-3 h-3 mr-1"/>}
                         {draft.platform}
                       </Badge>
                       <span className="text-xs text-muted-foreground">{format(new Date(draft.updated_at), 'dd.MM.yy', { locale: de })}</span>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm line-clamp-3 mb-4">{draft.content || 'Kein Inhalt'}</p>
                     <div className="flex gap-2">
                       <Button size="sm" variant="outline" onClick={() => openEditDraft(draft)}><Edit className="w-3 h-3 mr-1"/> Bearbeiten</Button>
                       <Button size="sm" onClick={() => navigate('/schedule', { state: { draft } })}><Send className="w-3 h-3 mr-1"/> Planen</Button>
                       <Button size="icon" variant="ghost" className="ml-auto text-destructive" onClick={() => deleteDraft(draft.id)}><Trash2 className="w-4 h-4"/></Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
            </div>
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
        <Dialog open={isDraftDialogOpen} onOpenChange={setIsDraftDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader><DialogTitle>Entwurf</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScrollArea className="h-[50vh] pr-4">
                <div className="space-y-4">
                  <Select value={draftForm.platform} onValueChange={(v) => setDraftForm(prev => ({ ...prev, platform: v }))}>
                    <SelectTrigger><SelectValue placeholder="Plattform" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea value={draftForm.content} onChange={(e) => setDraftForm(prev => ({ ...prev, content: e.target.value }))} placeholder="Inhalt..." rows={5} />
                  <MediaUpload onUpload={(urls) => setDraftForm(prev => ({ ...prev, media_urls: [...prev.media_urls, ...urls] }))} uploadedUrls={draftForm.media_urls} onRemove={(url) => setDraftForm(prev => ({ ...prev, media_urls: prev.media_urls.filter(u => u !== url) }))} />
                </div>
              </ScrollArea>
              <div>
                <HashtagSuggestions content={draftForm.content} platform={(draftForm.platform || 'instagram') as any} selectedHashtags={draftForm.hashtags} onSelect={(tags) => setDraftForm(prev => ({ ...prev, hashtags: tags }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveDraft} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ContentPlanner;