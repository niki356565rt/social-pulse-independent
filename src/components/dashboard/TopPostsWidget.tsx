import { useTopPosts, Post } from "@/hooks/useTopPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  MessageCircle, 
  Eye,
  Instagram,
  Youtube,
  Music2,
  ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopPostsWidgetProps {
  selectedAccountId?: string;
}

function getPlatformIcon(platform?: string) {
  switch (platform?.toLowerCase()) {
    case "instagram":
      return <Instagram className="w-4 h-4" />;
    case "youtube":
      return <Youtube className="w-4 h-4" />;
    case "tiktok":
      return <Music2 className="w-4 h-4" />;
    default:
      return <ImageIcon className="w-4 h-4" />;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("de-DE");
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

interface PostCardProps {
  post: Post;
  rank: number;
  type: "top" | "worst";
}

function PostCard({ post, rank, type }: PostCardProps) {
  const isTop = type === "top";
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
        isTop ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
      )}>
        {rank}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "p-1 rounded",
            post.platform === "instagram" ? "bg-pink-500/10 text-pink-500" :
            post.platform === "youtube" ? "bg-red-500/10 text-red-500" :
            post.platform === "tiktok" ? "bg-cyan-500/10 text-cyan-500" :
            "bg-muted text-muted-foreground"
          )}>
            {getPlatformIcon(post.platform)}
          </span>
          <span className="text-xs text-muted-foreground">@{post.username}</span>
          <span className="text-xs text-muted-foreground">• {formatDate(post.posted_at)}</span>
        </div>
        
        <p className="text-sm line-clamp-2 mb-2">
          {post.content || "Kein Textinhalt"}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {formatNumber(post.likes_count)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {formatNumber(post.comments_count)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatNumber(post.views_count)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TopPostsWidget({ selectedAccountId }: TopPostsWidgetProps) {
  const { topPosts, worstPosts, loading } = useTopPosts(selectedAccountId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="kpi-card">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div className="kpi-card">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const hasPosts = topPosts.length > 0 || worstPosts.length > 0;

  if (!hasPosts) {
    return (
      <div className="kpi-card">
        <h3 className="text-lg font-semibold mb-4">Post-Performance</h3>
        <p className="text-muted-foreground text-sm">
          Noch keine Post-Daten verfügbar. Die Posts werden automatisch beim nächsten Datenabruf geladen.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Posts */}
      <div className="kpi-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold">Top 3 Posts</h3>
            <p className="text-xs text-muted-foreground">Höchstes Engagement</p>
          </div>
        </div>
        
        {topPosts.length > 0 ? (
          <div>
            {topPosts.map((post, index) => (
              <PostCard key={post.id} post={post} rank={index + 1} type="top" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Keine Daten verfügbar</p>
        )}
      </div>

      {/* Worst Posts */}
      <div className="kpi-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold">Flop 3 Posts</h3>
            <p className="text-xs text-muted-foreground">Niedrigstes Engagement</p>
          </div>
        </div>
        
        {worstPosts.length > 0 ? (
          <div>
            {worstPosts.map((post, index) => (
              <PostCard key={post.id} post={post} rank={index + 1} type="worst" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Keine Daten verfügbar</p>
        )}
      </div>
    </div>
  );
}
