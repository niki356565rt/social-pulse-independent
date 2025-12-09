import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface EngagementHistoryItem {
  name: string;
  likes: number;
  comments: number;
}

interface EngagementChartProps {
  data?: EngagementHistoryItem[];
}

const defaultData: EngagementHistoryItem[] = [
  { name: "Mo", likes: 0, comments: 0 },
  { name: "Di", likes: 0, comments: 0 },
  { name: "Mi", likes: 0, comments: 0 },
  { name: "Do", likes: 0, comments: 0 },
  { name: "Fr", likes: 0, comments: 0 },
  { name: "Sa", likes: 0, comments: 0 },
  { name: "So", likes: 0, comments: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 border border-border">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const EngagementChart = ({ data = defaultData }: EngagementChartProps) => {
  const chartData = data.length > 0 ? data : defaultData;
  const hasData = chartData.some(d => d.likes > 0 || d.comments > 0);

  return (
    <div className="kpi-card h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Engagement</h3>
          <p className="text-sm text-muted-foreground">Likes & Kommentare diese Woche</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Likes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">Kommentare</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="h-[85%] flex items-center justify-center text-muted-foreground">
          <p>Verbinde Social Media Accounts, um Daten anzuzeigen</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="likes" 
              fill="hsl(187, 92%, 55%)" 
              radius={[4, 4, 0, 0]}
              name="Likes"
            />
            <Bar 
              dataKey="comments" 
              fill="hsl(270, 70%, 60%)" 
              radius={[4, 4, 0, 0]}
              name="Kommentare"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
