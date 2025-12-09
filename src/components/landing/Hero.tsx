import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Hero = () => {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      
      <div className="container relative z-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Jetzt in der Beta verfügbar</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight"
        >
          Alle Social Media
          <br />
          <span className="gradient-text">Analytics an einem Ort</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Verfolge dein Wachstum auf Instagram, TikTok, YouTube und mehr. 
          Echtzeitdaten, intelligente Insights und automatische Reports.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link to={user ? "/dashboard" : "/auth"}>
            <Button variant="hero" size="xl">
              {user ? "Zum Dashboard" : "Kostenlos starten"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="glass" size="xl">
            Demo ansehen
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {[
            { icon: Users, value: "10K+", label: "Aktive Nutzer" },
            { icon: BarChart3, value: "50M+", label: "Datenpunkte analysiert" },
            { icon: TrendingUp, value: "99.9%", label: "Uptime garantiert" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="glass-card rounded-xl p-6 text-center"
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
