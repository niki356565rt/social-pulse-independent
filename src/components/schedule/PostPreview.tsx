import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  Music,
  Share2,
  Instagram,
  Youtube,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface PostPreviewProps {
  platform: 'instagram' | 'tiktok' | 'youtube';
  username: string;
  avatarUrl?: string;
  content: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'carousel' | 'reels';
}

const InstagramPreview = ({ username, avatarUrl, content, mediaUrls, mediaType }: Omit<PostPreviewProps, 'platform'>) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isVideo = mediaType === 'video' || mediaType === 'reels';

  return (
    <div className="bg-black text-white rounded-xl overflow-hidden max-w-[320px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold">{username}</span>
        </div>
        <MoreHorizontal className="w-5 h-5" />
      </div>

      {/* Media */}
      <div className="relative aspect-square bg-zinc-900">
        {mediaUrls.length > 0 ? (
          <>
            {isVideo ? (
              <video 
                src={mediaUrls[currentSlide]} 
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img 
                src={mediaUrls[currentSlide]} 
                alt="Post preview" 
                className="w-full h-full object-cover"
              />
            )}
            {/* Carousel indicators */}
            {mediaUrls.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {mediaUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all',
                      i === currentSlide ? 'bg-blue-500 w-2' : 'bg-white/50'
                    )}
                  />
                ))}
              </div>
            )}
            {mediaType === 'reels' && (
              <Badge className="absolute top-3 right-3 bg-white/20 text-white border-0">
                Reels
              </Badge>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            Keine Medien
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 cursor-pointer hover:text-red-500 transition-colors" />
            <MessageCircle className="w-6 h-6 cursor-pointer" />
            <Send className="w-6 h-6 cursor-pointer" />
          </div>
          <Bookmark className="w-6 h-6 cursor-pointer" />
        </div>
        
        {/* Likes */}
        <p className="text-sm font-semibold mb-1">0 „Gefällt mir"-Angaben</p>
        
        {/* Caption */}
        {content && (
          <p className="text-sm">
            <span className="font-semibold">{username}</span>{' '}
            <span className="text-white/90 whitespace-pre-wrap">{content}</span>
          </p>
        )}
        
        {/* Time */}
        <p className="text-xs text-white/50 mt-2">Gerade eben</p>
      </div>
    </div>
  );
};

const TikTokPreview = ({ username, avatarUrl, content, mediaUrls }: Omit<PostPreviewProps, 'platform' | 'mediaType'>) => {
  return (
    <div className="bg-black text-white rounded-xl overflow-hidden max-w-[280px] mx-auto">
      {/* Video area */}
      <div className="relative aspect-[9/16] bg-zinc-900">
        {mediaUrls.length > 0 ? (
          <video 
            src={mediaUrls[0]} 
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            Kein Video
          </div>
        )}

        {/* Right sidebar */}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-pink-500 text-white text-xs">
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="w-5 h-5 -mt-2.5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px]">+</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <Heart className="w-8 h-8" />
            <span className="text-xs">0</span>
          </div>
          
          <div className="flex flex-col items-center">
            <MessageCircle className="w-8 h-8" />
            <span className="text-xs">0</span>
          </div>
          
          <div className="flex flex-col items-center">
            <Bookmark className="w-8 h-8" />
            <span className="text-xs">0</span>
          </div>
          
          <div className="flex flex-col items-center">
            <Share2 className="w-8 h-8" />
            <span className="text-xs">0</span>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-600 animate-spin-slow flex items-center justify-center">
            <Music className="w-4 h-4" />
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-3 left-3 right-16">
          <p className="text-sm font-semibold mb-1">@{username}</p>
          {content && (
            <p className="text-sm text-white/90 line-clamp-3 whitespace-pre-wrap">{content}</p>
          )}
          <div className="flex items-center gap-1 mt-2">
            <Music className="w-3 h-3" />
            <span className="text-xs">Originalton - {username}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// NEU: YouTube Shorts Preview
const YouTubeShortsPreview = ({ username, avatarUrl, content, mediaUrls }: Omit<PostPreviewProps, 'platform' | 'mediaType'>) => {
  // Extrahiere Titel aus Content wenn vorhanden
  let title = "Neues Video";
  let description = content;
  
  if (content?.includes("TITLE:")) {
    const parts = content.split("\n");
    const titleLine = parts.find(p => p.startsWith("TITLE:"));
    if (titleLine) {
      title = titleLine.replace("TITLE:", "").trim();
      description = content.replace(titleLine, "").trim();
    }
  }

  return (
    <div className="bg-zinc-900 text-white rounded-xl overflow-hidden max-w-[280px] mx-auto">
      {/* Video area - 9:16 for Shorts */}
      <div className="relative aspect-[9/16] bg-black">
        {mediaUrls.length > 0 ? (
          <video 
            src={mediaUrls[0]} 
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            Kein Video
          </div>
        )}

        {/* Shorts Badge */}
        <Badge className="absolute top-3 left-3 bg-red-600 text-white border-0 gap-1">
          <Youtube className="w-3 h-3" /> Shorts
        </Badge>

        {/* Right sidebar - YouTube style */}
        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-5">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">0</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ThumbsDown className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">-</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">0</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">Teilen</span>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-3 left-3 right-16">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-8 h-8 border border-white/30">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-red-600 text-white text-xs">
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">@{username}</span>
            <Badge variant="outline" className="text-xs border-white/50 text-white bg-transparent">
              Abonnieren
            </Badge>
          </div>
          <p className="text-sm font-semibold mb-1 line-clamp-2">{title}</p>
          {description && (
            <p className="text-xs text-white/70 line-clamp-2 whitespace-pre-wrap">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const PostPreview = ({ platform, ...props }: PostPreviewProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {platform === 'instagram' ? (
            <>
              <Instagram className="w-4 h-4" /> Instagram Vorschau
            </>
          ) : platform === 'youtube' ? (
            <>
              <Youtube className="w-4 h-4 text-red-600" /> YouTube Shorts Vorschau
            </>
          ) : (
            <>
              <TikTokIcon className="w-4 h-4" /> TikTok Vorschau
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center py-4">
        {platform === 'instagram' ? (
          <InstagramPreview {...props} />
        ) : platform === 'youtube' ? (
          <YouTubeShortsPreview {...props} />
        ) : (
          <TikTokPreview {...props} />
        )}
      </CardContent>
    </Card>
  );
};

export const PostPreviewTabs = ({ 
  username, 
  avatarUrl, 
  content, 
  mediaUrls, 
  mediaType,
  platform 
}: PostPreviewProps) => {
  // YouTube: Zeige direkt YouTube Shorts Preview
  if (platform === 'youtube') {
    return <PostPreview platform="youtube" username={username} avatarUrl={avatarUrl} content={content} mediaUrls={mediaUrls} mediaType={mediaType} />;
  }

  // TikTok: Zeige direkt TikTok Preview
  if (platform === 'tiktok') {
    return <PostPreview platform="tiktok" username={username} avatarUrl={avatarUrl} content={content} mediaUrls={mediaUrls} mediaType={mediaType} />;
  }

  // Instagram: Tabs für Feed/Reels
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Vorschau</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="reels" disabled={mediaType !== 'reels' && mediaType !== 'video'}>
              Reels
            </TabsTrigger>
          </TabsList>
          <TabsContent value="feed" className="flex justify-center">
            <InstagramPreview 
              username={username} 
              avatarUrl={avatarUrl} 
              content={content} 
              mediaUrls={mediaUrls} 
              mediaType={mediaType}
            />
          </TabsContent>
          <TabsContent value="reels" className="flex justify-center">
            <TikTokPreview 
              username={username} 
              avatarUrl={avatarUrl} 
              content={content} 
              mediaUrls={mediaUrls}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};