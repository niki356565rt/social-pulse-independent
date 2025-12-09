import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface MetricData {
  date: string;
  followers: number;
  engagement: number;
  likes: number;
  comments: number;
  views: number;
}

interface AccountData {
  platform: string;
  username: string;
  metrics: MetricData[];
}

interface ReportData {
  accounts: AccountData[];
  period: 'week' | 'month';
  startDate: Date;
  endDate: Date;
}

interface GeneratedReport {
  doc: jsPDF;
  filename: string;
  base64: string;
}

const createPDFDocument = (data: ReportData): { doc: jsPDF; filename: string } => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(99, 102, 241);
  doc.text('Social Media Report', pageWidth / 2, 25, { align: 'center' });
  
  // Period subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const periodText = data.period === 'week' ? 'Wochenbericht' : 'Monatsbericht';
  const dateRange = `${format(data.startDate, 'dd. MMMM yyyy', { locale: de })} - ${format(data.endDate, 'dd. MMMM yyyy', { locale: de })}`;
  doc.text(`${periodText}: ${dateRange}`, pageWidth / 2, 35, { align: 'center' });
  
  // Generated date
  doc.setFontSize(10);
  doc.text(`Erstellt am: ${format(new Date(), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr`, pageWidth / 2, 42, { align: 'center' });
  
  let yPosition = 55;
  
  // Summary section
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text('Zusammenfassung', 14, yPosition);
  yPosition += 10;
  
  // Calculate totals
  const totals = data.accounts.reduce((acc, account) => {
    const latestMetric = account.metrics[account.metrics.length - 1] || { followers: 0, engagement: 0, likes: 0, comments: 0, views: 0 };
    const firstMetric = account.metrics[0] || { followers: 0, engagement: 0, likes: 0, comments: 0, views: 0 };
    
    return {
      totalFollowers: acc.totalFollowers + latestMetric.followers,
      followerGrowth: acc.followerGrowth + (latestMetric.followers - firstMetric.followers),
      totalLikes: acc.totalLikes + account.metrics.reduce((sum, m) => sum + m.likes, 0),
      totalComments: acc.totalComments + account.metrics.reduce((sum, m) => sum + m.comments, 0),
      totalViews: acc.totalViews + account.metrics.reduce((sum, m) => sum + m.views, 0),
      avgEngagement: acc.avgEngagement + (account.metrics.reduce((sum, m) => sum + m.engagement, 0) / Math.max(account.metrics.length, 1)),
    };
  }, { totalFollowers: 0, followerGrowth: 0, totalLikes: 0, totalComments: 0, totalViews: 0, avgEngagement: 0 });
  
  if (data.accounts.length > 0) {
    totals.avgEngagement = totals.avgEngagement / data.accounts.length;
  }
  
  // Summary table
  autoTable(doc, {
    startY: yPosition,
    head: [['Metrik', 'Wert']],
    body: [
      ['Gesamte Follower', totals.totalFollowers.toLocaleString('de-DE')],
      ['Follower-Wachstum', `${totals.followerGrowth >= 0 ? '+' : ''}${totals.followerGrowth.toLocaleString('de-DE')}`],
      ['Gesamte Likes', totals.totalLikes.toLocaleString('de-DE')],
      ['Gesamte Kommentare', totals.totalComments.toLocaleString('de-DE')],
      ['Gesamte Views', totals.totalViews.toLocaleString('de-DE')],
      ['Durchschn. Engagement-Rate', `${totals.avgEngagement.toFixed(2)}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    margin: { left: 14, right: 14 },
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // Per-platform breakdown
  data.accounts.forEach((account) => {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    const platformIcon = account.platform === 'instagram' ? '📷' : account.platform === 'tiktok' ? '🎵' : '▶️';
    doc.text(`${platformIcon} ${account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} - @${account.username}`, 14, yPosition);
    yPosition += 8;
    
    if (account.metrics.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Keine Daten für diesen Zeitraum verfügbar', 14, yPosition);
      yPosition += 15;
      return;
    }
    
    const tableData = account.metrics.map(m => [
      format(new Date(m.date), 'dd.MM.yyyy', { locale: de }),
      m.followers.toLocaleString('de-DE'),
      m.likes.toLocaleString('de-DE'),
      m.comments.toLocaleString('de-DE'),
      m.views.toLocaleString('de-DE'),
      `${m.engagement.toFixed(2)}%`,
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Datum', 'Follower', 'Likes', 'Kommentare', 'Views', 'Engagement']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  });
  
  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Seite ${i} von ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }
  
  const filename = `social-media-report-${data.period === 'week' ? 'woche' : 'monat'}-${format(data.startDate, 'yyyy-MM-dd')}.pdf`;
  
  return { doc, filename };
};

export const generatePDFReport = (data: ReportData): void => {
  const { doc, filename } = createPDFDocument(data);
  doc.save(filename);
};

export const generatePDFReportForEmail = (data: ReportData): GeneratedReport => {
  const { doc, filename } = createPDFDocument(data);
  const base64 = doc.output('datauristring').split(',')[1];
  return { doc, filename, base64 };
};

export const getReportPeriod = (type: 'week' | 'month'): { startDate: Date; endDate: Date } => {
  const now = new Date();
  
  if (type === 'week') {
    return {
      startDate: startOfWeek(subDays(now, 7), { weekStartsOn: 1 }),
      endDate: endOfWeek(subDays(now, 7), { weekStartsOn: 1 }),
    };
  }
  
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    startDate: startOfMonth(lastMonth),
    endDate: endOfMonth(lastMonth),
  };
};
