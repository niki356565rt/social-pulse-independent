import { useState, useMemo } from 'react';
import { ScheduledPost } from '@/hooks/useScheduledPosts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Instagram, 
  Clock,
  Image,
  Video,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface ScheduleCalendarProps {
  posts: ScheduledPost[];
  onReschedule: (postId: string, newDate: Date) => void;
  onPostClick: (post: ScheduledPost) => void;
}

const statusColors = {
  scheduled: 'bg-blue-500',
  publishing: 'bg-yellow-500',
  published: 'bg-green-500',
  failed: 'bg-red-500',
};

const DraggablePost = ({ post, onPostClick }: { post: ScheduledPost; onPostClick: (post: ScheduledPost) => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const PlatformIcon = post.platform === 'tiktok' ? TikTokIcon : Instagram;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onPostClick(post);
      }}
      className={cn(
        'text-xs p-1.5 rounded cursor-grab active:cursor-grabbing transition-all',
        'bg-card border border-border hover:border-primary/50 shadow-sm',
        isDragging && 'opacity-50 scale-105 z-50'
      )}
    >
      <div className="flex items-center gap-1">
        <div className={cn('w-1.5 h-1.5 rounded-full', statusColors[post.status])} />
        <PlatformIcon className="w-3 h-3" />
        <span className="truncate flex-1">{format(new Date(post.scheduled_for), 'HH:mm')}</span>
      </div>
    </div>
  );
};

const DroppableDay = ({ 
  date, 
  posts, 
  currentMonth,
  onPostClick 
}: { 
  date: Date; 
  posts: ScheduledPost[]; 
  currentMonth: Date;
  onPostClick: (post: ScheduledPost) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(),
    data: { date },
  });

  const dayPosts = posts.filter(post => isSameDay(new Date(post.scheduled_for), date));
  const isCurrentMonth = isSameMonth(date, currentMonth);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[80px] p-1 border-t border-border transition-colors',
        !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
        isToday(date) && 'bg-primary/5',
        isOver && 'bg-primary/10 border-primary'
      )}
    >
      <div className={cn(
        'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
        isToday(date) && 'bg-primary text-primary-foreground'
      )}>
        {format(date, 'd')}
      </div>
      <div className="space-y-1">
        {dayPosts.slice(0, 3).map((post) => (
          <DraggablePost key={post.id} post={post} onPostClick={onPostClick} />
        ))}
        {dayPosts.length > 3 && (
          <div className="text-xs text-muted-foreground text-center">
            +{dayPosts.length - 3} mehr
          </div>
        )}
      </div>
    </div>
  );
};

export const ScheduleCalendar = ({ posts, onReschedule, onPostClick }: ScheduleCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const postId = active.id as string;
    const newDateStr = over.id as string;
    const post = posts.find(p => p.id === postId);

    if (!post || post.status !== 'scheduled') return;

    const oldDate = new Date(post.scheduled_for);
    const newDate = new Date(newDateStr);
    
    // Keep the same time, just change the date
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds());

    if (!isSameDay(oldDate, newDate)) {
      onReschedule(postId, newDate);
    }
  };

  const activePost = activeId ? posts.find(p => p.id === activeId) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Kalender</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveId(event.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          {/* Week day headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((day) => (
              <div key={day} className="text-xs font-medium text-muted-foreground text-center py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 border border-border rounded-lg overflow-hidden">
            {days.map((day) => (
              <DroppableDay
                key={day.toISOString()}
                date={day}
                posts={posts}
                currentMonth={currentMonth}
                onPostClick={onPostClick}
              />
            ))}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activePost && (
              <div className="text-xs p-1.5 rounded bg-card border border-primary shadow-lg">
                <div className="flex items-center gap-1">
                  <div className={cn('w-1.5 h-1.5 rounded-full', statusColors[activePost.status])} />
                  {activePost.platform === 'tiktok' ? (
                    <TikTokIcon className="w-3 h-3" />
                  ) : (
                    <Instagram className="w-3 h-3" />
                  )}
                  <span>{format(new Date(activePost.scheduled_for), 'HH:mm')}</span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Geplant</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Wird veröffentlicht</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Veröffentlicht</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Fehlgeschlagen</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
