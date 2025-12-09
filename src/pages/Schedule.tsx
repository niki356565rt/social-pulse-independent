import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useScheduledPosts, ScheduledPost } from '@/hooks/useScheduledPosts';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { MediaUpload } from '@/components/schedule/MediaUpload';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { PostPreviewTabs } from '@/components/schedule/PostPreview';
import { PostAnalyticsCard, AnalyticsOverview } from '@/components/schedule/PostAnalytics';
import { RecurringPostForm } from '@/components/schedule/RecurringPostForm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // NEU
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  Image as ImageIcon, 
  Video, 
  Trash2,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  Instagram,
  List,
  CalendarDays,
  Repeat,
  Eye,
  Youtube // NEU
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const statusConfig = {
  scheduled: { label: 'Geplant', icon: Clock, color: 'bg-blue-500/20 text-blue-500' },
  publishing: { label: 'Wird veröffentlicht', icon: Loader2, color: 'bg-yellow-500/20 text-yellow-500' },
  published: { label: 'Veröffentlicht', icon: CheckCircle, color: 'bg-green-500/20 text-green-500' },
  failed: { label: 'Fehlgeschlagen', icon: AlertCircle, color: 'bg-red-500/20 text-red-500' },
};

const mediaTypeConfig = {
  image: { label: 'Bild', icon: ImageIcon },
  video: { label: 'Video', icon: Video },
  carousel: { label: 'Karussell', icon: ImageIcon },
  reels: { label: 'Reels', icon: Video },
};

const Schedule = () => {
  const { posts, loading, createPost, updatePost, deletePost, publishNow } = useScheduledPosts();
  const { accounts } = useSocialAccounts();
  
  const instagramAccounts = accounts.filter(a => a.platform === 'instagram');
  const tiktokAccounts = accounts.filter(a => a.platform === 'tiktok');
  const youtubeAccounts = accounts.filter(a => a.platform === 'youtube'); // NEU
  
  const allAccounts = [...instagramAccounts, ...tiktokAccounts, ...youtubeAccounts];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    account_id: '',
    platform: '' as 'instagram' | 'tiktok' | 'youtube' | '',
    title: '', // NEU für YouTube
    content: '',
    media_urls: [] as string[],
    media_type: 'image' as 'image' | 'video' | 'carousel' | 'reels',
    scheduled_date: undefined as Date | undefined,
    scheduled_time: '12:00',
    is_recurring: false,
    recurrence_pattern: '',
    recurrence_end_date: undefined as Date | undefined,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAccount = useMemo(() => 
    allAccounts.find(a => a.id === formData.account_id),
    [allAccounts, formData.account_id]
  );

  const handleAccountChange = (accountId: string) => {
    const account = allAccounts.find(a => a.id === accountId);
    if (account) {
      setFormData(prev => ({
        ...prev,
        account_id: accountId,
        platform: account.platform as any,
        media_type: (account.platform === 'tiktok' || account.platform === 'youtube') ? 'video' : prev.media_type,
      }));
    }
  };

  const handleCreate = async () => {
    if (!formData.account_id || formData.media_urls.length === 0 || !formData.scheduled_date) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    if (formData.platform === 'youtube' && !formData.title) {
      toast.error('Für YouTube wird ein Titel benötigt');
      return;
    }

    setIsSubmitting(true);

    const scheduledFor = new Date(formData.scheduled_date);
    const [hours, minutes] = formData.scheduled_time.split(':').map(Number);
    scheduledFor.setHours(hours, minutes, 0, 0);

    // YouTube Titel in den Content integrieren
    let finalContent = formData.content;
    if (formData.platform === 'youtube') {
      finalContent = `TITLE: ${formData.title}\n${formData.content}`;
    }

    const result = await createPost({
      account_id: formData.account_id,
      platform: formData.platform as any,
      content: finalContent,
      media_urls: formData.media_urls,
      media_type: formData.media_urls.length > 1 ? 'carousel' : formData.media_type,
      scheduled_for: scheduledFor.toISOString(),
      is_recurring: formData.is_recurring,
      recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : undefined,
      recurrence_end_date: formData.recurrence_end_date?.toISOString(),
    });

    if (result) {
      setIsCreateOpen(false);
      resetForm();
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      account_id: '',
      platform: '',
      title: '',
      content: '',
      media_urls: [],
      media_type: 'image',
      scheduled_date: undefined,
      scheduled_time: '12:00',
      is_recurring: false,
      recurrence_pattern: '',
      recurrence_end_date: undefined,
    });
    setShowPreview(false);
  };

  const handleReschedule = async (postId: string, newDate: Date) => {
    const success = await updatePost(postId, { scheduled_for: newDate.toISOString() });
    if (success) toast.success('Post verschoben');
  };

  const handlePostClick = (post: ScheduledPost) => setSelectedPost(post);

  if (loading) return <DashboardLayout><div className="p-8"><Skeleton className="h-10 w-48 mb-8" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Content Planer</h1>
            <p className="text-muted-foreground">Plane Posts für Instagram, TikTok & YouTube</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}>
              <TabsList>
                <TabsTrigger value="calendar"><CalendarDays className="w-4 h-4 mr-1" /> Kalender</TabsTrigger>
                <TabsTrigger value="list"><List className="w-4 h-4 mr-1" /> Liste</TabsTrigger>
              </TabsList>
            </Tabs>
            <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="default" disabled={allAccounts.length === 0}>
                  <Plus className="w-4 h-4 mr-2" /> Post planen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Neuen Post planen</DialogTitle>
                  <DialogDescription>Erstelle Content für deine verbundenen Kanäle</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-4">
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Account</label>
                        <Select value={formData.account_id} onValueChange={handleAccountChange}>
                          <SelectTrigger><SelectValue placeholder="Account auswählen" /></SelectTrigger>
                          <SelectContent>
                            {instagramAccounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}><div className="flex gap-2"><Instagram className="w-4 h-4"/> @{acc.username}</div></SelectItem>
                            ))}
                            {tiktokAccounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}><div className="flex gap-2"><TikTokIcon className="w-4 h-4"/> @{acc.username}</div></SelectItem>
                            ))}
                            {youtubeAccounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}><div className="flex gap-2"><Youtube className="w-4 h-4 text-red-600"/> {acc.username}</div></SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.platform === 'youtube' && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Titel <span className="text-red-500">*</span></label>
                          <Input 
                            placeholder="Video Titel..." 
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {formData.platform === 'youtube' ? 'Beschreibung' : 'Caption'}
                        </label>
                        <Textarea
                          placeholder="Text eingeben..."
                          value={formData.content}
                          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                          rows={4}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Medien</label>
                        <MediaUpload
                          onUpload={(urls) => setFormData(prev => ({ ...prev, media_urls: [...prev.media_urls, ...urls] }))}
                          uploadedUrls={formData.media_urls}
                          onRemove={(url) => setFormData(prev => ({ ...prev, media_urls: prev.media_urls.filter(u => u !== url) }))}
                          maxFiles={formData.platform === 'tiktok' || formData.platform === 'youtube' ? 1 : 10}
                          accept={formData.platform === 'youtube' || formData.platform === 'tiktok' ? 'video/*' : 'image/*,video/*'}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Datum</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !formData.scheduled_date && 'text-muted-foreground')}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.scheduled_date ? format(formData.scheduled_date, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={formData.scheduled_date} onSelect={(date) => setFormData(prev => ({ ...prev, scheduled_date: date }))} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Uhrzeit</label>
                          <Select value={formData.scheduled_time} onValueChange={(v) => setFormData(prev => ({ ...prev, scheduled_time: v }))}>
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

                      <RecurringPostForm
                        isRecurring={formData.is_recurring}
                        onIsRecurringChange={(v) => setFormData(prev => ({ ...prev, is_recurring: v }))}
                        recurrencePattern={formData.recurrence_pattern}
                        onRecurrencePatternChange={(v) => setFormData(prev => ({ ...prev, recurrence_pattern: v }))}
                        recurrenceEndDate={formData.recurrence_end_date}
                        onRecurrenceEndDateChange={(v) => setFormData(prev => ({ ...prev, recurrence_end_date: v }))}
                      />
                    </div>
                  </ScrollArea>

                  <div className="hidden lg:block">
                    {formData.platform && formData.media_urls.length > 0 ? (
                      <PostPreviewTabs
                        platform={formData.platform as any}
                        username={selectedAccount?.username || 'username'}
                        content={formData.content}
                        mediaUrls={formData.media_urls}
                        mediaType={formData.media_type}
                      />
                    ) : (
                      <Card className="h-full flex items-center justify-center bg-muted/30">
                        <CardContent className="text-center">
                          <Eye className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Vorschau erscheint hier</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Abbrechen</Button>
                  <Button onClick={handleCreate} disabled={isSubmitting || !formData.account_id || formData.media_urls.length === 0 || !formData.scheduled_date}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarIcon className="w-4 h-4 mr-2" />}
                    {formData.is_recurring ? 'Serie planen' : 'Planen'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <AnalyticsOverview posts={posts} />
        {viewMode === 'calendar' ? (
          <ScheduleCalendar posts={posts} onReschedule={handleReschedule} onPostClick={handlePostClick} />
        ) : (
          <div className="space-y-4">
             {posts.map(post => (
               <Card key={post.id} className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handlePostClick(post)}>
                 <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     {post.platform === 'youtube' ? <Youtube className="w-5 h-5 text-red-600"/> : post.platform === 'instagram' ? <Instagram className="w-5 h-5 text-pink-600"/> : <TikTokIcon className="w-5 h-5"/>}
                     <span className="font-medium">{format(new Date(post.scheduled_for), 'dd.MM.yyyy HH:mm', {locale: de})}</span>
                   </div>
                   <Badge variant="outline">{statusConfig[post.status]?.label}</Badge>
                 </div>
               </Card>
             ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Schedule;