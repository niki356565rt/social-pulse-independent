import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Calendar, Loader2, Mail, Send, Lock, Crown } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Reports = () => {
  const { accounts, isGenerating, isSendingEmail, generateReport, sendReportEmail, exportCSV } = useReportData();
  const { user } = useAuth();
  const { canAccess } = useSubscription();
  const hasAccounts = accounts && accounts.length > 0;
  const canExportCSV = canAccess("csvExport");
  const canExportPDF = canAccess("pdfReport");
  
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('month');
  const [email, setEmail] = useState(user?.email || '');

  const handleSendEmail = async () => {
    await sendReportEmail(selectedPeriod, email);
    setEmailDialogOpen(false);
  };

  const openEmailDialog = (period: 'week' | 'month') => {
    setSelectedPeriod(period);
    setEmail(user?.email || '');
    setEmailDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Reports</h1>
            <p className="text-muted-foreground">Exportiere und analysiere deine Daten</p>
          </div>
        </div>

        {!hasAccounts && (
          <div className="kpi-card mb-8 text-center py-8">
            <p className="text-muted-foreground mb-2">Keine Social Media Accounts verbunden</p>
            <p className="text-sm text-muted-foreground">Verbinde zuerst deine Accounts unter "Accounts" um Reports zu erstellen.</p>
          </div>
        )}

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* CSV Export */}
          <div className={`kpi-card ${!canExportCSV ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              {!canExportCSV && (
                <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Pro
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">CSV Export</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Exportiere alle Rohdaten als CSV-Datei für eigene Analysen in Excel oder Google Sheets.
            </p>
            {canExportCSV ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={exportCSV}
                disabled={!hasAccounts}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV herunterladen
              </Button>
            ) : (
              <Link to="/subscription" className="block">
                <Button variant="outline" className="w-full">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade auf Pro
                </Button>
              </Link>
            )}
          </div>

          {/* Wochenbericht PDF */}
          <div className={`kpi-card ${!canExportPDF ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              {!canExportPDF && (
                <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Premium
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">Wochenbericht</h3>
            <p className="text-sm text-muted-foreground mb-4">
              PDF-Report mit der Performance der letzten Woche inkl. aller KPIs.
            </p>
            {canExportPDF ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => generateReport('week')}
                  disabled={!hasAccounts || isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openEmailDialog('week')}
                  disabled={!hasAccounts || isSendingEmail}
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/subscription" className="block">
                <Button variant="outline" className="w-full">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade auf Premium
                </Button>
              </Link>
            )}
          </div>

          {/* Monatsbericht PDF */}
          <div className={`kpi-card ${!canExportPDF ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-instagram/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-instagram" />
              </div>
              {!canExportPDF && (
                <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Premium
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">Monatsbericht</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Umfassender PDF-Report mit Monatsübersicht und Wachstumsanalyse.
            </p>
            {canExportPDF ? (
              <div className="flex gap-2">
                <Button 
                  variant="gradient" 
                  className="flex-1"
                  onClick={() => generateReport('month')}
                  disabled={!hasAccounts || isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openEmailDialog('month')}
                  disabled={!hasAccounts || isSendingEmail}
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/subscription" className="block">
                <Button variant="gradient" className="w-full">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade auf Premium
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Connected Accounts Info */}
        {hasAccounts && (
          <div className="kpi-card">
            <h3 className="text-lg font-semibold mb-4">Verbundene Accounts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Reports werden für folgende Accounts erstellt:
            </p>
            <div className="flex flex-wrap gap-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="px-3 py-1.5 rounded-full bg-secondary/50 text-sm flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    account.platform === 'instagram' ? 'bg-instagram' :
                    account.platform === 'tiktok' ? 'bg-tiktok' : 'bg-youtube'
                  }`} />
                  <span className="capitalize">{account.platform}</span>
                  <span className="text-muted-foreground">@{account.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedPeriod === 'week' ? 'Wochenbericht' : 'Monatsbericht'} per E-Mail senden
              </DialogTitle>
              <DialogDescription>
                Der Report wird als PDF-Anhang an die angegebene E-Mail-Adresse gesendet.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                type="email"
                placeholder="E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSendEmail} disabled={isSendingEmail || !email}>
                {isSendingEmail ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Senden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
