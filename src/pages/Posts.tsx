import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopPosts, Post } from "@/hooks/useTopPosts";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { BestPostingTimesWidget } from "@/components/dashboard/BestPostingTimesWidget";
import { 
  Search, 
  Filter, 
  ArrowUpDown,
  Heart, 
  MessageCircle, 
  Eye, 
  Share2,
  Instagram,
  Youtube,
  Music2,
  Calendar,
  TrendingUp,
  TrendingDown,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

type SortField = "engagement_rate" | "likes_count" | "comments_count" | "views_count" | "posted_at";
type SortOrder = "asc" | "desc";

function getPlatformIcon(platform?: string) {
  switch (platform?.toLowerCase()) {
    case "instagram":
      return <Instagram className="w-4 h-4" />;
    case "youtube":
      return <Youtube className="w-4 h-4" />;
    case "tiktok":
      return <Music2 className="w-4 h-4" />;
    default:
      return null;
  }
}

function getPlatformColor(platform?: string) {
  switch (platform?.toLowerCase()) {
    case "instagram":
      return "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400";
    case "youtube":
      return "bg-red-600";
    case "tiktok":
      return "bg-foreground";
    default:
      return "bg-muted";
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
    year: "numeric",
  });
}

interface PostCardProps {
  post: Post;
}

function PostCard({ post }: PostCardProps) {
  const engagementColor = (post.engagement_rate ?? 0) >= 3 
    ? "text-emerald-500" 
    : (post.engagement_rate ?? 0) >= 1 
      ? "text-amber-500" 
      : "text-red-500";

  return (
    <div className="kpi-card hover:border-primary/30 transition-colors">
      <div className="flex gap-4">
        {/* Media Preview */}
        <div className="relative shrink-0">
          {post.media_url ? (
            <img 
              src={post.media_url} 
              alt="Post preview"
              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-3xl">📷</span>
            </div>
          )}
          <div className={cn(
            "absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white",
            getPlatformColor(post.platform)
          )}>
            {getPlatformIcon(post.platform)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-medium">@{post.username}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(post.posted_at)}
              </p>
            </div>
            <div className={cn("flex items-center gap-1 text-sm font-semibold", engagementColor)}>
              {(post.engagement_rate ?? 0) >= 3 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {post.engagement_rate?.toFixed(2) ?? 0}%
            </div>
          </div>

          <p className="text-sm line-clamp-2 mb-3 text-muted-foreground">
            {post.content || "Kein Textinhalt verfügbar"}
          </p>

          {/* Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="w-4 h-4 text-pink-500" />
              {formatNumber(post.likes_count)}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              {formatNumber(post.comments_count)}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="w-4 h-4 text-purple-500" />
              {formatNumber(post.views_count)}
            </span>
            {post.shares_count > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Share2 className="w-4 h-4 text-green-500" />
                {formatNumber(post.shares_count)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const Posts = () => {
  const { accounts } = useSocialAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const { allPosts, loading } = useTopPosts(selectedAccountId);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("engagement_rate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = [...allPosts];

    // Platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter(p => p.platform === platformFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.content?.toLowerCase().includes(query) ||
        p.username?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number, bVal: number;
      
      switch (sortField) {
        case "engagement_rate":
          aVal = a.engagement_rate ?? 0;
          bVal = b.engagement_rate ?? 0;
          break;
        case "likes_count":
          aVal = a.likes_count;
          bVal = b.likes_count;
          break;
        case "comments_count":
          aVal = a.comments_count;
          bVal = b.comments_count;
          break;
        case "views_count":
          aVal = a.views_count;
          bVal = b.views_count;
          break;
        case "posted_at":
          aVal = a.posted_at ? new Date(a.posted_at).getTime() : 0;
          bVal = b.posted_at ? new Date(b.posted_at).getTime() : 0;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [allPosts, platformFilter, searchQuery, sortField, sortOrder]);

  // Get unique platforms
  const platforms = useMemo(() => {
    const unique = [...new Set(allPosts.map(p => p.platform).filter(Boolean))];
    return unique as string[];
  }, [allPosts]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "desc" ? "asc" : "desc");
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Posts</h1>
          <p className="text-muted-foreground">Alle deine Posts mit Performance-Daten</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Account Filter - NEU */}
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <User className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Account wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Accounts</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>
                  <span className="flex items-center gap-2">
                    {acc.platform === 'instagram' ? '📸' : acc.platform === 'youtube' ? '📺' : '🎵'} @{acc.username}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Posts durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Platform Filter */}
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Plattform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Plattformen</SelectItem>
              {platforms.map(platform => (
                <SelectItem key={platform} value={platform}>
                  <span className="flex items-center gap-2">
                    {getPlatformIcon(platform)}
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sortieren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engagement_rate">Engagement</SelectItem>
              <SelectItem value="likes_count">Likes</SelectItem>
              <SelectItem value="comments_count">Kommentare</SelectItem>
              <SelectItem value="views_count">Views</SelectItem>
              <SelectItem value="posted_at">Datum</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={toggleSortOrder}>
            <ArrowUpDown className={cn(
              "w-4 h-4 transition-transform",
              sortOrder === "asc" && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Best Posting Times Widget */}
        {!loading && allPosts.length > 0 && (
          <div className="mb-8">
            <BestPostingTimesWidget posts={allPosts} />
          </div>
        )}

        {/* Stats */}
        {!loading && allPosts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{filteredPosts.length}</p>
              <p className="text-xs text-muted-foreground">Posts angezeigt</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {formatNumber(filteredPosts.reduce((sum, p) => sum + p.likes_count, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Gesamt Likes</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {formatNumber(filteredPosts.reduce((sum, p) => sum + p.comments_count, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Gesamt Kommentare</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {filteredPosts.length > 0 
                  ? (filteredPosts.reduce((sum, p) => sum + (p.engagement_rate ?? 0), 0) / filteredPosts.length).toFixed(2)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Ø Engagement</p>
            </div>
          </div>
        )}

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="kpi-card text-center py-12">
            <p className="text-lg font-medium mb-2">Keine Posts gefunden</p>
            <p className="text-muted-foreground text-sm">
              {allPosts.length === 0 
                ? "Posts werden beim nächsten Datenabruf geladen."
                : "Versuche andere Filterkriterien."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Posts;