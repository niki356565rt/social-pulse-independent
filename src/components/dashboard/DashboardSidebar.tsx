import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  LayoutDashboard, 
  Link2, 
  Settings, 
  Zap,
  LogOut,
  ImageIcon,
  Crown,
  Users,
  UsersRound,
  CalendarClock,
  PenSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PLAN_CONFIG } from "@/lib/planLimits";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/accounts", icon: Link2, label: "Accounts" },
  { to: "/posts", icon: ImageIcon, label: "Posts" },
  { to: "/content-planner", icon: PenSquare, label: "Content Planer" },
  { to: "/schedule", icon: CalendarClock, label: "Auto-Posting" },
  { to: "/competitors", icon: Users, label: "Konkurrenz" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/subscription", icon: Crown, label: "Abonnement" },
  { to: "/settings", icon: Settings, label: "Einstellungen" },
];

export const DashboardSidebar = () => {
  const { user, signOut } = useAuth();
  const { plan } = useSubscription();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Erfolgreich abgemeldet");
    navigate("/");
  };

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const planName = PLAN_CONFIG[plan].name;

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(187, 92%, 55%) 0%, hsl(270, 70%, 60%) 100%)' }}>
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-sidebar-foreground">SocialPulse</span>
          </a>
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
            activeClassName="bg-sidebar-accent text-sidebar-foreground"
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/50">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{planName} Plan</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
};
