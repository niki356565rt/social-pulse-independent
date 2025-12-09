import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(187, 92%, 55%) 0%, hsl(270, 70%, 60%) 100%)' }}>
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SocialPulse</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Alle Social Media Analytics an einem Ort.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Produkt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Preise</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Roadmap</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Unternehmen</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Über uns</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Karriere</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Kontakt</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Datenschutz</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">AGB</Link></li>
              <li><Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 SocialPulse. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
