import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface FollowerHistoryItem {
  day: string;
  instagram: number;
  tiktok: number;
  youtube: number;
}

interface FollowerChartProps {
  data?: FollowerHistoryItem[];
}

const defaultData: FollowerHistoryItem[] = [
  { day: "1", instagram: 0, tiktok: 0, youtube: 0 },
  { day: "5", instagram: 0, tiktok: 0, youtube: 0 },
  { day: "10", instagram: 0, tiktok: 0, youtube: 0 },
  { day: "15", instagram: 0, tiktok: 0, youtube: 0 },
  { day: "20", instagram: 0, tiktok: 0, youtube: 0 },
  { day: "25", instagram: 0, tiktok: 0, youtube: 0 },
  { day: "30", instagram: 0, tiktok: 0, youtube: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 border border-border">
        <p className="text-sm font-medium mb-2">Tag {label}</p>
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

export const FollowerChart = ({ data = defaultData }: FollowerChartProps) => {
  const chartData = data.length > 0 ? data : defaultData;
  const hasData = chartData.some(d => d.instagram > 0 || d.tiktok > 0 || d.youtube > 0);

  return (
    <div className="kpi-card h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Follower Entwicklung</h3>
          <p className="text-sm text-muted-foreground">Letzte 30 Tage</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-instagram" />
            <span className="text-muted-foreground">Instagram</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-foreground" />
            <span className="text-muted-foreground">TikTok</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-youtube" />
            <span className="text-muted-foreground">YouTube</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="h-[85%] flex items-center justify-center text-muted-foreground">
          <p>Verbinde Social Media Accounts, um Daten anzuzeigen</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="instagramGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(326, 78%, 58%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(326, 78%, 58%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tiktokGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210, 40%, 98%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(210, 40%, 98%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="youtubeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="instagram"
              stroke="hsl(326, 78%, 58%)"
              strokeWidth={2}
              fill="url(#instagramGradient)"
              name="Instagram"
            />
            <Area
              type="monotone"
              dataKey="tiktok"
              stroke="hsl(210, 40%, 98%)"
              strokeWidth={2}
              fill="url(#tiktokGradient)"
              name="TikTok"
            />
            <Area
              type="monotone"
              dataKey="youtube"
              stroke="hsl(0, 100%, 50%)"
              strokeWidth={2}
              fill="url(#youtubeGradient)"
              name="YouTube"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
