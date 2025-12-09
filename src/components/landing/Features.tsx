import { motion } from "framer-motion";
import { 
  BarChart3, 
  Bell, 
  Calendar, 
  Download, 
  Globe, 
  LineChart, 
  Lock, 
  Users,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Multi-Plattform",
    description: "Instagram, TikTok, YouTube, Twitter und mehr in einem Dashboard.",
  },
  {
    icon: LineChart,
    title: "Echtzeit-Analytics",
    description: "Follower, Likes, Kommentare und Reichweite immer aktuell.",
  },
  {
    icon: BarChart3,
    title: "Detaillierte Reports",
    description: "Exportiere deine Daten als CSV oder PDF mit einem Klick.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Werde benachrichtigt bei ungewöhnlichem Wachstum oder Einbrüchen.",
  },
  {
    icon: Calendar,
    title: "Beste Posting-Zeit",
    description: "KI-basierte Empfehlungen für optimale Engagement-Zeiten.",
  },
  {
    icon: Users,
    title: "Team-Zugang",
    description: "Arbeite mit deinem Team zusammen an gemeinsamen Projekten.",
  },
  {
    icon: Lock,
    title: "Sichere API-Tokens",
    description: "Deine Zugangsdaten werden verschlüsselt gespeichert.",
  },
  {
    icon: Zap,
    title: "Auto-Sync",
    description: "Automatischer Datenabruf alle 15 Minuten.",
  },
  {
    icon: Download,
    title: "Monatsreports",
    description: "Automatische monatliche Zusammenfassungen per E-Mail.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 px-4 relative" id="features">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Alles was du brauchst,
            <br />
            <span className="gradient-text">um zu wachsen</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professionelle Analytics-Tools für Content Creator und Agenturen.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="kpi-card group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
