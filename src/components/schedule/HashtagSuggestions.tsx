import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash, Sparkles, Copy, Check, TrendingUp, Target, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Hashtag {
  tag: string;
  category: 'trending' | 'niche' | 'general' | 'branded';
  popularity: 'high' | 'medium' | 'low';
}

interface HashtagSuggestionsProps {
  content: string;
  platform: 'instagram' | 'tiktok';
  onSelect: (hashtags: string[]) => void;
  selectedHashtags: string[];
}

const categoryConfig = {
  trending: { label: 'Trending', icon: TrendingUp, color: 'bg-orange-500/20 text-orange-500' },
  niche: { label: 'Nische', icon: Target, color: 'bg-purple-500/20 text-purple-500' },
  general: { label: 'Allgemein', icon: Tag, color: 'bg-blue-500/20 text-blue-500' },
  branded: { label: 'Brand', icon: Sparkles, color: 'bg-pink-500/20 text-pink-500' },
};

const popularityConfig = {
  high: { label: 'Hoch', color: 'text-green-500' },
  medium: { label: 'Mittel', color: 'text-yellow-500' },
  low: { label: 'Niedrig', color: 'text-muted-foreground' },
};

export const HashtagSuggestions = ({ content, platform, onSelect, selectedHashtags }: HashtagSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSuggestions = async () => {
    if (!content.trim()) {
      toast.error('Bitte gib zuerst einen Caption-Text ein');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-hashtags', {
        body: { content, platform, language: 'de' }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Zu viele Anfragen. Bitte warte einen Moment.');
        } else if (data.error.includes('credits')) {
          toast.error('AI-Credits aufgebraucht. Bitte Credits aufladen.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      setSuggestions(data.hashtags || []);
      
      if (data.hashtags?.length === 0) {
        toast.info('Keine Hashtags generiert. Versuche es mit mehr Text.');
      }
    } catch (error: any) {
      console.error('Error generating hashtags:', error);
      toast.error('Fehler beim Generieren der Hashtags');
    } finally {
      setLoading(false);
    }
  };

  const toggleHashtag = (tag: string) => {
    if (selectedHashtags.includes(tag)) {
      onSelect(selectedHashtags.filter(h => h !== tag));
    } else {
      onSelect([...selectedHashtags, tag]);
    }
  };

  const selectAll = () => {
    onSelect(suggestions.map(s => s.tag));
  };

  const copyToClipboard = () => {
    const text = selectedHashtags.map(h => `#${h}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Hashtags kopiert');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" />
            Hashtag-Vorschläge
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateSuggestions}
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 mr-1 animate-pulse" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                KI Vorschläge
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Alle auswählen
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {selectedHashtags.length} ausgewählt
                </span>
                {selectedHashtags.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    Kopieren
                  </Button>
                )}
              </div>
            </div>

            {/* Hashtags by category */}
            {(['trending', 'niche', 'general', 'branded'] as const).map(category => {
              const categoryTags = suggestions.filter(s => s.category === category);
              if (categoryTags.length === 0) return null;

              const config = categoryConfig[category];
              const CategoryIcon = config.icon;

              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryIcon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map((hashtag) => {
                      const isSelected = selectedHashtags.includes(hashtag.tag);
                      const popConfig = popularityConfig[hashtag.popularity];
                      
                      return (
                        <Badge
                          key={hashtag.tag}
                          variant={isSelected ? 'default' : 'outline'}
                          className={cn(
                            'cursor-pointer transition-all hover:scale-105',
                            isSelected && 'bg-primary',
                            !isSelected && config.color
                          )}
                          onClick={() => toggleHashtag(hashtag.tag)}
                        >
                          #{hashtag.tag}
                          <span className={cn('ml-1 text-[10px]', popConfig.color)}>
                            •
                          </span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Preview */}
            {selectedHashtags.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-medium mb-2">Vorschau:</p>
                <p className="text-sm text-muted-foreground break-words">
                  {selectedHashtags.map(h => `#${h}`).join(' ')}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Klicke auf "KI Vorschläge" um passende Hashtags zu generieren
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
