import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Settings, 
  Zap,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

const ONBOARDING_KEY = 'socialmetrics_onboarding_completed';

const steps: OnboardingStep[] = [
  {
    icon: <BarChart3 className="w-12 h-12 text-primary" />,
    title: 'Willkommen bei Social Metrics',
    description: 'Dein All-in-One Dashboard für Social Media Analytics',
    features: [
      'Verfolge deine Follower-Entwicklung',
      'Analysiere dein Engagement',
      'Optimiere deine Posting-Zeiten'
    ]
  },
  {
    icon: <Users className="w-12 h-12 text-primary" />,
    title: 'Accounts verbinden',
    description: 'Verbinde deine Social Media Accounts für umfassende Analysen',
    features: [
      'Instagram, TikTok, YouTube & mehr',
      'Sichere OAuth-Authentifizierung',
      'Automatische Daten-Synchronisation'
    ]
  },
  {
    icon: <FileText className="w-12 h-12 text-primary" />,
    title: 'Posts analysieren',
    description: 'Erhalte detaillierte Einblicke in die Performance deiner Beiträge',
    features: [
      'Beste Posting-Zeiten ermitteln',
      'Engagement-Heatmaps',
      'Top-Posts identifizieren'
    ]
  },
  {
    icon: <Zap className="w-12 h-12 text-primary" />,
    title: 'KI-gestützte Insights',
    description: 'Lass dir von KI personalisierte Empfehlungen geben',
    features: [
      'Automatische Trend-Erkennung',
      'Wachstums-Prognosen',
      'Konkurrenz-Analysen (Pro+)'
    ]
  },
  {
    icon: <Settings className="w-12 h-12 text-primary" />,
    title: 'Bereit loszulegen?',
    description: 'Passe deine Einstellungen an und starte durch!',
    features: [
      'E-Mail-Benachrichtigungen konfigurieren',
      'Berichte automatisieren',
      'Zum Premium upgraden für mehr Features'
    ]
  }
];

export const OnboardingDialog = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay for better UX
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-6 pt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 p-4 rounded-full bg-primary/10">
                  {step.icon}
                </div>
                
                <h2 className="text-xl font-semibold mb-2">{step.title}</h2>
                <p className="text-muted-foreground mb-6">{step.description}</p>
                
                <ul className="space-y-3 w-full text-left mb-6">
                  {step.features.map((feature, idx) => (
                    <motion.li 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            {/* Step indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep 
                      ? 'bg-primary w-6' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Überspringen
              </Button>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrev}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Zurück
                  </Button>
                )}
                <Button size="sm" onClick={handleNext}>
                  {isLastStep ? (
                    <>
                      Los geht's
                      <Check className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Weiter
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
