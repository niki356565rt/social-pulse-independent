import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Loader2, Settings } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_CONFIG, PlanType } from '@/lib/planLimits';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const Subscription = () => {
  const [searchParams] = useSearchParams();
  const { plan, isLoading, subscriptionEnd, checkSubscription, openCheckout, openCustomerPortal } = useSubscription();

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast.success('Abo erfolgreich abgeschlossen!');
      checkSubscription();
    } else if (checkoutStatus === 'canceled') {
      toast.info('Checkout abgebrochen');
    }
  }, [searchParams, checkSubscription]);

  const handleSelectPlan = async (planKey: PlanType) => {
    if (planKey === 'free') return;
    if (planKey === plan) {
      toast.info('Du hast diesen Plan bereits');
      return;
    }

    try {
      await openCheckout(planKey);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Fehler beim Öffnen des Checkouts');
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Fehler beim Öffnen des Kundenportals');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const planOrder: PlanType[] = ['free', 'pro', 'premium', 'b2b'];
  const currentPlanIndex = planOrder.indexOf(plan);

  const getButtonText = (planKey: PlanType, index: number) => {
    if (plan === planKey) return 'Aktueller Plan';
    if (planKey === 'free') return 'Kostenlos';
    if (index < currentPlanIndex) return 'Downgrade';
    return 'Upgraden';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Abonnement</h1>
            <p className="text-muted-foreground">Verwalte dein Abo und wähle den passenden Plan</p>
          </div>
          {plan !== 'free' && (
            <Button variant="outline" onClick={handleManageSubscription}>
              <Settings className="mr-2 h-4 w-4" />
              Abo verwalten
            </Button>
          )}
        </div>

        {/* Current Plan Info */}
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <CardTitle>Aktueller Plan: {PLAN_CONFIG[plan].name}</CardTitle>
            </div>
            <CardDescription>
              {subscriptionEnd ? (
                <>Nächste Abrechnung: {format(new Date(subscriptionEnd), 'dd. MMMM yyyy', { locale: de })}</>
              ) : (
                'Kostenloser Plan - Jederzeit upgraden'
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {planOrder.map((planKey, index) => {
            const config = PLAN_CONFIG[planKey];
            const isCurrentPlan = plan === planKey;
            const isLowerPlan = index < currentPlanIndex;
            const features = [
              `${config.limits.maxAccounts === Infinity ? 'Unbegrenzte' : config.limits.maxAccounts} Account${config.limits.maxAccounts !== 1 ? 's' : ''}`,
              `${config.limits.historyDays === Infinity ? 'Unbegrenzte' : config.limits.historyDays} Tage Historie`,
              config.limits.allKpis && 'Alle KPIs',
              config.limits.csvExport && 'CSV Export',
              config.limits.pdfReport && 'PDF Report',
              config.limits.aiInsights && 'AI Insights',
              config.limits.alerts && 'Smart Alerts',
              config.limits.competitorBenchmark && 'Konkurrenz-Benchmark',
              config.limits.teamAccess && 'Team-Zugänge',
              config.limits.apiAccess && 'API Zugang',
            ].filter(Boolean);

            return (
              <Card 
                key={planKey} 
                className={`relative ${isCurrentPlan ? 'border-primary border-2' : ''}`}
              >
                {isCurrentPlan && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                    Dein Plan
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{config.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">{config.price}€</span>
                    <span className="text-muted-foreground">/Monat</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'default' : 'outline'}
                    disabled={isCurrentPlan || planKey === 'free' || isLowerPlan}
                    onClick={() => handleSelectPlan(planKey)}
                  >
                    {getButtonText(planKey, index)}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
