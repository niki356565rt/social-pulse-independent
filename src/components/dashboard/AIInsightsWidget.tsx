import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, Lock, Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const AIInsightsWidget = () => {
  const { plan, canAccess } = useSubscription();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const hasAccess = canAccess('aiInsights');

  const generateInsights = async () => {
    if (!session?.access_token) {
      toast.error('Bitte melde dich an');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-insights', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setInsights(data.insights);
      setGeneratedAt(data.generatedAt);
      toast.success('AI Insights generiert!');
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Fehler beim Generieren der Insights');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Insights</CardTitle>
            </div>
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
          <CardDescription>
            KI-gestützte Analyse deiner Social Media Performance
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Erhalte personalisierte Wachstumstrends und Empfehlungen mit AI Insights.
            </p>
            <Button onClick={() => navigate('/subscription')}>
              Auf Premium upgraden
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Insights</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateInsights}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                {insights ? 'Aktualisieren' : 'Generieren'}
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          KI-gestützte Analyse deiner Social Media Performance
          {generatedAt && (
            <span className="block text-xs mt-1">
              Zuletzt aktualisiert: {new Date(generatedAt).toLocaleString('de-DE')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Analysiere deine Daten...</p>
            </div>
          </div>
        ) : insights ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div 
              className="text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ 
                __html: insights
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br />')
              }} 
            />
          </div>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              Klicke auf "Generieren" um KI-basierte Insights zu deinen Accounts zu erhalten.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
