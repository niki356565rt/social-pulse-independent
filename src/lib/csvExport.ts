import { format } from "date-fns";
import { de } from "date-fns/locale";

interface MetricRow {
  date: string;
  platform: string;
  username: string;
  followers: number;
  following: number | null;
  posts: number | null;
  likes: number | null;
  comments: number | null;
  views: number | null;
  engagementRate: number | null;
}

export function generateMetricsCSV(data: MetricRow[]): string {
  const headers = [
    "Datum",
    "Plattform",
    "Username",
    "Follower",
    "Following",
    "Posts",
    "Likes",
    "Kommentare",
    "Views",
    "Engagement Rate (%)",
  ];

  const rows = data.map((row) => [
    row.date,
    row.platform,
    row.username,
    row.followers,
    row.following ?? "",
    row.posts ?? "",
    row.likes ?? "",
    row.comments ?? "",
    row.views ?? "",
    row.engagementRate ?? "",
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.join(";")),
  ].join("\n");

  // Add BOM for Excel compatibility with German umlauts
  return "\uFEFF" + csvContent;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getExportFilename(): string {
  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: de });
  return `social-metrics-${dateStr}.csv`;
}
