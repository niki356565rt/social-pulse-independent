export type PlanType = 'free' | 'pro' | 'premium' | 'b2b';

export interface PlanLimits {
  maxAccounts: number; // Gesamtanzahl aller verbundenen Profile (egal welche Plattform)
  historyDays: number;
  allKpis: boolean;
  csvExport: boolean;
  pdfReport: boolean;
  aiInsights: boolean;
  alerts: boolean;
  competitorBenchmark: boolean;
  teamAccess: boolean;
  apiAccess: boolean;
}

export const PLAN_CONFIG: Record<PlanType, {
  name: string;
  price: number;
  priceId: string | null;
  productId: string | null;
  limits: PlanLimits;
}> = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    productId: null,
    limits: {
      maxAccounts: 1, // Ein einziges Profil insgesamt
      historyDays: 7,
      allKpis: false,
      csvExport: false,
      pdfReport: false,
      aiInsights: false,
      alerts: false,
      competitorBenchmark: false,
      teamAccess: false,
      apiAccess: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 9,
    priceId: 'price_1SawMWJiSnyqWIaz1vRHnLZE',
    productId: 'prod_TY2RgCkDlp7KdQ',
    limits: {
      maxAccounts: 5, // Z.B. 2 Insta, 3 YouTube
      historyDays: 30, // Oder Infinity, wenn Sie wollen
      allKpis: true,
      csvExport: true,
      pdfReport: false,
      aiInsights: false,
      alerts: false,
      competitorBenchmark: false,
      teamAccess: false,
      apiAccess: false,
    },
  },
  premium: {
    name: 'Premium',
    price: 19,
    priceId: 'price_1SawMtJiSnyqWIaz0AScyBvB',
    productId: 'prod_TY2RMi7mXZvgHE',
    limits: {
      maxAccounts: 20,
      historyDays: Infinity, // Unbegrenzte Historie
      allKpis: true,
      csvExport: true,
      pdfReport: true,
      aiInsights: true,
      alerts: true,
      competitorBenchmark: false,
      teamAccess: false,
      apiAccess: false,
    },
  },
  b2b: {
    name: 'B2B/Agenturen',
    price: 49,
    priceId: 'price_1SawNDJiSnyqWIazGGVavTvH',
    productId: 'prod_TY2SGDTpRePqJC',
    limits: {
      maxAccounts: Infinity,
      historyDays: Infinity,
      allKpis: true,
      csvExport: true,
      pdfReport: true,
      aiInsights: true,
      alerts: true,
      competitorBenchmark: true,
      teamAccess: false, // Feature entfernt
      apiAccess: true,
    },
  },
};

export const getPlanByProductId = (productId: string | null): PlanType => {
  if (!productId) return 'free';
  for (const [plan, config] of Object.entries(PLAN_CONFIG)) {
    if (config.productId === productId) return plan as PlanType;
  }
  return 'free';
};

export const canAccessFeature = (plan: PlanType, feature: keyof PlanLimits): boolean => {
  const limits = PLAN_CONFIG[plan].limits;
  const value = limits[feature];
  return typeof value === 'boolean' ? value : value > 0;
};

export const getAccountLimit = (plan: PlanType): number => {
  return PLAN_CONFIG[plan].limits.maxAccounts;
};

export const getHistoryLimit = (plan: PlanType): number => {
  return PLAN_CONFIG[plan].limits.historyDays;
};