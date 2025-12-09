import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Impressum from "./pages/Impressum";
import { CookieBanner } from "./components/CookieBanner";
import Accounts from "./pages/Accounts";
import Posts from "./pages/Posts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import Competitors from "./pages/Competitors";
import Schedule from "./pages/Schedule";
import ContentPlanner from "./pages/ContentPlanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <SubscriptionProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/impressum" element={<Impressum />} />
                  
                  {/* Dashboard Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
                  <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                  <Route path="/competitors" element={<ProtectedRoute><Competitors /></ProtectedRoute>} />
                  <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
                  <Route path="/content-planner" element={<ProtectedRoute><ContentPlanner /></ProtectedRoute>} />
                  
                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CookieBanner />
              </SubscriptionProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;