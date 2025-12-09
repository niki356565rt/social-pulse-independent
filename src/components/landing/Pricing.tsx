import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const plans = [
  {
    name: "Free",
    planKey: "free",
    price: "0€",
    period: "/Monat",
    description: "Perfekt zum Ausprobieren",
    features: [
      "1 Social Media Account",
      "3 Basis-KPIs",
      "7 Tage Historie",
      "Community Support",
    ],
    cta: "Kostenlos starten",
    popular: false,
  },
  {
    name: "Pro",
    planKey: "pro",
    price: "9€",
    period: "/Monat",
    description: "Für Creator und Influencer",
    features: [
      "Bis zu 5 Accounts",
      "Alle KPIs verfügbar",
      "30 Tage Historie",
      "CSV Export",
      "Priority Support",
    ],
    cta: "Pro wählen",
    popular: true,
  },
  {
    name: "Premium",
    planKey: "premium",
    price: "19€",
    period: "/Monat",
    description: "Für professionelle Creator",
    features: [
      "Bis zu 20 Accounts",
      "90 Tage Historie",
      "AI Insights & Trends",
      "Smart Alerts",
      "PDF Reports",
      "Beste Posting-Zeiten",
    ],
    cta: "Premium wählen",
    popular: false,
  },
  {
    name: "Agenturen",
    planKey: "b2b",
    price: "49€",
    period: "/Monat",
    description: "Für Teams und Agenturen",
    features: [
      "Unbegrenzte Accounts",
      "Unbegrenzte Historie",
      "Konkurrenz-Benchmark",
      "Team-Zugänge",
      "White-Label Reports",
      "API Zugang",
      "Dedicated Support",
    ],
    cta: "Kontakt aufnehmen",
    popular: false,
  },
];

export const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelectPlan = (planKey: string) => {
    if (user) {
      navigate(`/subscription?select=${planKey}`);
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="py-24 px-4" id="pricing">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Einfache, <span className="gradient-text">transparente</span> Preise
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Wähle den Plan, der zu dir passt. Jederzeit upgraden oder kündigen.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? "bg-gradient-to-b from-primary/20 to-accent/10 border-2 border-primary/50"
                  : "glass-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    Beliebt
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "gradient" : "outline"}
                className="w-full"
                onClick={() => handleSelectPlan(plan.planKey)}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
