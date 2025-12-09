import { useMemo } from "react";
import { Post } from "./useTopPosts";

interface TimeSlot {
  hour: number;
  dayOfWeek: number;
  avgEngagement: number;
  postCount: number;
}

interface BestTime {
  hour: number;
  dayOfWeek: number;
  avgEngagement: number;
  postCount: number;
}

const DAYS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const DAYS_SHORT_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function useBestPostingTimes(posts: Post[]) {
  const analysis = useMemo(() => {
    if (!posts || posts.length === 0) {
      return {
        bestTimes: [] as BestTime[],
        heatmapData: [] as TimeSlot[],
        bestDay: null as string | null,
        bestHour: null as number | null,
        hasEnoughData: false,
      };
    }

    // Group posts by hour and day of week
    const timeSlots: Map<string, { engagements: number[]; count: number }> = new Map();

    posts.forEach((post) => {
      if (!post.posted_at || post.engagement_rate === null) return;

      const date = new Date(post.posted_at);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${dayOfWeek}-${hour}`;

      if (!timeSlots.has(key)) {
        timeSlots.set(key, { engagements: [], count: 0 });
      }

      const slot = timeSlots.get(key)!;
      slot.engagements.push(post.engagement_rate);
      slot.count++;
    });

    // Calculate averages and create heatmap data
    const heatmapData: TimeSlot[] = [];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        const slot = timeSlots.get(key);
        
        if (slot && slot.count > 0) {
          const avgEngagement = slot.engagements.reduce((a, b) => a + b, 0) / slot.count;
          heatmapData.push({
            hour,
            dayOfWeek: day,
            avgEngagement,
            postCount: slot.count,
          });
        }
      }
    }

    // Sort by engagement to find best times
    const sortedSlots = [...heatmapData].sort((a, b) => b.avgEngagement - a.avgEngagement);
    const bestTimes = sortedSlots.slice(0, 5);

    // Calculate best day overall
    const dayEngagements: Map<number, number[]> = new Map();
    heatmapData.forEach((slot) => {
      if (!dayEngagements.has(slot.dayOfWeek)) {
        dayEngagements.set(slot.dayOfWeek, []);
      }
      dayEngagements.get(slot.dayOfWeek)!.push(slot.avgEngagement);
    });

    let bestDay: string | null = null;
    let bestDayAvg = 0;
    dayEngagements.forEach((engagements, day) => {
      const avg = engagements.reduce((a, b) => a + b, 0) / engagements.length;
      if (avg > bestDayAvg) {
        bestDayAvg = avg;
        bestDay = DAYS_DE[day];
      }
    });

    // Calculate best hour overall
    const hourEngagements: Map<number, number[]> = new Map();
    heatmapData.forEach((slot) => {
      if (!hourEngagements.has(slot.hour)) {
        hourEngagements.set(slot.hour, []);
      }
      hourEngagements.get(slot.hour)!.push(slot.avgEngagement);
    });

    let bestHour: number | null = null;
    let bestHourAvg = 0;
    hourEngagements.forEach((engagements, hour) => {
      const avg = engagements.reduce((a, b) => a + b, 0) / engagements.length;
      if (avg > bestHourAvg) {
        bestHourAvg = avg;
        bestHour = hour;
      }
    });

    return {
      bestTimes,
      heatmapData,
      bestDay,
      bestHour,
      hasEnoughData: posts.filter(p => p.posted_at && p.engagement_rate !== null).length >= 5,
    };
  }, [posts]);

  return {
    ...analysis,
    getDayName: (day: number) => DAYS_DE[day],
    getDayShortName: (day: number) => DAYS_SHORT_DE[day],
    formatHour: (hour: number) => `${hour.toString().padStart(2, "0")}:00`,
  };
}
