import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COOKIE_CONSENT_KEY = "socialpulse_cookie_consent";

export const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ 
      essential: true, 
      analytics: true, 
      marketing: true,
      timestamp: new Date().toISOString() 
    }));
    setShowBanner(false);
  };

  const acceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ 
      essential: true, 
      analytics: false, 
      marketing: false,
      timestamp: new Date().toISOString() 
    }));
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="container max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl shadow-lg p-6 relative">
              <button 
                onClick={acceptEssential}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="hidden sm:flex h-12 w-12 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1 pr-8 sm:pr-0">
                  <h3 className="font-semibold text-lg mb-2">Cookie-Einstellungen</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Wir verwenden Cookies, um Ihre Erfahrung zu verbessern, den Website-Verkehr zu analysieren 
                    und personalisierte Inhalte anzuzeigen. Sie können wählen, welche Cookies Sie akzeptieren möchten.
                    Weitere Informationen finden Sie in unserer{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Datenschutzerklärung
                    </Link>.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={acceptAll} className="flex-1 sm:flex-none">
                      Alle akzeptieren
                    </Button>
                    <Button onClick={acceptEssential} variant="outline" className="flex-1 sm:flex-none">
                      Nur essenzielle
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
