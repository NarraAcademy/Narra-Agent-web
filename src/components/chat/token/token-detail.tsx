"use client";

import useSWR from "swr";
import { ExternalLinkIcon, ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TableOfContents, type TocItem } from "../table-of-contents";
import type { TokenDetail, ApiResponse, BackendTokenResponse } from "@/types/entity";

/**
 * 骨架屏组件
 */
function TokenDetailSkeleton() {
  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-8 animate-pulse">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 w-24 bg-muted rounded" />
                <div className="h-6 w-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block w-64 shrink-0">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-24" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-muted rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 章节标题组件
 */
function SectionTitle({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2
      id={id}
      className="text-2xl font-bold text-foreground mb-4 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

/**
 * 数据项组件
 */
function DataItem({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-semibold", highlight ? "text-xl" : "text-base", "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

/**
 * Token详情内容组件 - 章节化布局
 */
export function TokenDetailContent({ entity, showToc }: { entity: string; showToc: boolean }) {
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const json: ApiResponse<BackendTokenResponse> = await response.json();
    if (json.code !== 0) throw new Error(json.message || 'Failed to fetch token details');
    return json.data.data;
  };

  const { data: token, error, isLoading } = useSWR<TokenDetail>(
    `/api/token?token=${encodeURIComponent(entity)}`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  if (isLoading) return <TokenDetailSkeleton />;
  if (error || !token) {
    return (
      <div className="text-sm text-muted-foreground text-center py-16">
        Failed to load token details
      </div>
    );
  }

  const { market_data, links, categories, community_data, developer_data } = token;

  const formatLargeNumber = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (value: string): { text: string; color: string; icon: React.ReactNode } => {
    const num = parseFloat(value);
    if (isNaN(num)) return { text: 'N/A', color: 'text-muted-foreground', icon: null };
    const isPositive = num >= 0;
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const icon = isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />;
    return { text: `${isPositive ? '+' : ''}${num.toFixed(2)}%`, color, icon };
  };

  const price1h = formatPercentage(market_data.price_change_percentage_1h);
  const price24h = formatPercentage(market_data.price_change_percentage_24h);
  const price7d = formatPercentage(market_data.price_change_percentage_7d);
  const price30d = formatPercentage(market_data.price_change_percentage_30d);

  // 目录项
  const tocItems: TocItem[] = [
    { id: 'overview', title: 'Overview', level: 1 },
    { id: 'price', title: 'Price & Market Data', level: 1 },
    { id: 'supply', title: 'Supply Information', level: 1 },
    { id: 'community', title: 'Community & Development', level: 1 },
    { id: 'about', title: 'About', level: 1 },
    { id: 'links', title: 'Links', level: 1 },
  ];

  return (
    <div className="flex gap-12">
      <div className="flex-1 min-w-0 space-y-12">
        {/* Overview Section */}
        <section id="overview" className="animate-fade-in-up">
          <SectionTitle id="overview">Overview</SectionTitle>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-6">
              <img
                src={token.image.large}
                alt={token.name}
                className="w-20 h-20 rounded-xl border border-border shrink-0"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {token.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-medium text-muted-foreground">
                    {token.symbol.toUpperCase()}
                  </span>
                  {token.market_cap_rank && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      Rank #{token.market_cap_rank}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-muted/30 rounded-lg border border-border">
              <div className="animate-fade-in-up">
                <DataItem label="Current Price" value={`$${market_data.current_price}`} highlight />
              </div>
              <div className="animate-fade-in-up">
                <DataItem label="Market Cap" value={formatLargeNumber(market_data.market_cap)} />
              </div>
              <div className="animate-fade-in-up">
                <DataItem label="24h Volume" value={formatLargeNumber(market_data.total_volume)} />
              </div>
            </div>
          </div>
        </section>

        {/* Price & Market Data Section */}
        <section id="price" className="animate-fade-in-up">
          <SectionTitle id="price">Price & Market Data</SectionTitle>
          <div className="space-y-6">
            {/* Price Changes */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Price Changes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '1h', data: price1h },
                  { label: '24h', data: price24h },
                  { label: '7d', data: price7d },
                  { label: '30d', data: price30d },
                ].map(({ label, data }) => (
                  <div
                    key={label}
                    className={cn(
                      "flex items-center justify-between gap-2 px-4 py-3 rounded-md border",
                      "bg-muted/20"
                    )}
                  >
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                    <div className={cn("flex items-center gap-1", data.color)}>
                      {data.icon}
                      <span className="text-sm font-semibold">{data.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ATH/ATL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 rounded-lg border border-border">
                <h3 className="text-sm font-medium text-muted-foreground">All-Time High</h3>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-foreground">{formatLargeNumber(market_data.ath)}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={cn("font-medium", formatPercentage(market_data.ath_change_percentage).color)}>
                      {formatPercentage(market_data.ath_change_percentage).text}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(market_data.ath_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-lg border border-border">
                <h3 className="text-sm font-medium text-muted-foreground">All-Time Low</h3>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-foreground">{formatLargeNumber(market_data.atl)}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={cn("font-medium", formatPercentage(market_data.atl_change_percentage).color)}>
                      {formatPercentage(market_data.atl_change_percentage).text}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(market_data.atl_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Market Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DataItem label="Fully Diluted Valuation" value={formatLargeNumber(market_data.fully_diluted_valuation)} />
                <DataItem label="24h High" value={formatLargeNumber(market_data.high_24h)} />
                <DataItem label="24h Low" value={formatLargeNumber(market_data.low_24h)} />
              </div>
            </div>
          </div>
        </section>

        {/* Supply Information Section */}
        <section id="supply" className="animate-fade-in-up">
          <SectionTitle id="supply">Supply Information</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataItem label="Circulating Supply" value={formatLargeNumber(market_data.circulating_supply)} />
            <DataItem label="Total Supply" value={formatLargeNumber(market_data.total_supply)} />
            {market_data.max_supply && (
              <DataItem label="Max Supply" value={formatLargeNumber(market_data.max_supply)} />
            )}
          </div>
        </section>

        {/* Community & Development Section */}
        <section id="community" className="animate-fade-in-up">
          <SectionTitle id="community">Community & Development</SectionTitle>
          <div className="space-y-6">
            {/* Community Data */}
            {community_data && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Community</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {community_data.reddit_subscribers > 0 && (
                    <DataItem label="Reddit Subscribers" value={community_data.reddit_subscribers.toLocaleString()} />
                  )}
                  {community_data.telegram_channel_user_count && (
                    <DataItem label="Telegram Users" value={community_data.telegram_channel_user_count.toLocaleString()} />
                  )}
                  {community_data.reddit_average_posts_48h > 0 && (
                    <DataItem label="Reddit Posts (48h)" value={community_data.reddit_average_posts_48h.toFixed(1)} />
                  )}
                </div>
              </div>
            )}

            {/* Developer Data */}
            {developer_data && developer_data.forks > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Development Activity</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DataItem label="GitHub Stars" value={developer_data.stars.toLocaleString()} />
                  <DataItem label="Forks" value={developer_data.forks.toLocaleString()} />
                  <DataItem label="Contributors" value={developer_data.pull_request_contributors.toLocaleString()} />
                  <DataItem label="Commits (4w)" value={developer_data.commit_count_4_weeks.toLocaleString()} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="animate-fade-in-up">
          <SectionTitle id="about">About {token.name}</SectionTitle>
          <div className="space-y-6">
            {/* Description */}
            {token.description && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-foreground/90 leading-relaxed">{token.description}</p>
              </div>
            )}

            {/* Categories */}
            {categories && categories.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, index) => (
                    <Badge
                      key={cat}
                      variant="outline"
                      className="text-sm"
                      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Links Section */}
        <section id="links" className="animate-fade-in-up">
          <SectionTitle id="links">Links & Resources</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Official Links */}
            {(links.homepage || links.twitter_screen_name) && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Official Links</h3>
                <div className="flex flex-wrap gap-2">
                  {links.homepage && (
                    <a
                      href={links.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-md",
                        "text-sm font-medium",
                        "bg-primary/10 text-primary hover:bg-primary/20",
                        "transition-all duration-300 hover:scale-105 hover:shadow-md"
                      )}
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {links.twitter_screen_name && (
                    <a
                      href={`https://twitter.com/${links.twitter_screen_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-md",
                        "text-sm font-medium",
                        "bg-primary/10 text-primary hover:bg-primary/20",
                        "transition-all duration-300 hover:scale-105 hover:shadow-md"
                      )}
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Blockchain Explorers */}
            {links.blockchain_site && links.blockchain_site.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Blockchain Explorers</h3>
                <div className="flex flex-wrap gap-2">
                  {links.blockchain_site.slice(0, 3).map((site, idx) => (
                    <a
                      key={idx}
                      href={site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-md",
                        "text-sm font-medium",
                        "bg-muted hover:bg-muted/80",
                        "transition-all duration-300 hover:scale-105 hover:shadow-md"
                      )}
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                      Explorer {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Table of Contents */}
      {showToc && <TableOfContents items={tocItems} />}
    </div>
  );
}
