import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PlanType, PLAN_CONFIG, canAccessFeature, PlanLimits } from '@/lib/planLimits';

interface SubscriptionContextType {
  plan: PlanType;
  isLoading: boolean;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
  canAccess: (feature: keyof PlanLimits) => boolean;
  openCheckout: (planKey: PlanType) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useAuth();
  const [plan, setPlan] = useState<PlanType>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setPlan('free');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setPlan(data.plan || 'free');
      setSubscriptionEnd(data.subscription_end);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setPlan('free');
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setPlan('free');
      setIsLoading(false);
    }
  }, [user, checkSubscription]);

  // Check subscription periodically (every 60 seconds)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const canAccess = useCallback((feature: keyof PlanLimits): boolean => {
    return canAccessFeature(plan, feature);
  }, [plan]);

  const openCheckout = useCallback(async (planKey: PlanType) => {
    if (!session?.access_token) {
      throw new Error('User must be logged in');
    }

    const planConfig = PLAN_CONFIG[planKey];
    if (!planConfig.priceId) {
      throw new Error('Free plan does not require checkout');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId: planConfig.priceId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (data.url) {
      window.open(data.url, '_blank');
    }
  }, [session?.access_token]);

  const openCustomerPortal = useCallback(async () => {
    if (!session?.access_token) {
      throw new Error('User must be logged in');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (data.url) {
      window.open(data.url, '_blank');
    }
  }, [session?.access_token]);

  return (
    <SubscriptionContext.Provider value={{
      plan,
      isLoading,
      subscriptionEnd,
      checkSubscription,
      canAccess,
      openCheckout,
      openCustomerPortal,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
