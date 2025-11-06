"use client";

import { useTokenDetail } from "@/hooks/use-token-detail";
import { ExternalLinkIcon, ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TableOfContents, type TocItem } from "../table-of-contents";
import type { UnifiedEntityDetail } from "@/types/unified-entity";
import { PriceChart } from "../price-chart";
import { EntityRadarChart } from "@/components/ui/entity-radar-chart";
import { calculateTokenScores } from "@/utils/entity-scores";
import Image from "next/image";

// 价格数据点类型
interface PriceDataPoint {
  timestamp: number;
  datetime: string;
  price: number;
}

// 价格图表数据类型
interface PriceChartData {
  current: number;
  start: number;
  change: number;
  change_percentage: number;
  high: number;
  low: number;
  data: PriceDataPoint[];
}

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
  const { data: token, error, isLoading } = useTokenDetail(entity);

  if (isLoading) return <TokenDetailSkeleton />;
  if (error || !token) {
    return (
      <div className="text-sm text-muted-foreground text-center py-16">
        Failed to load token details
      </div>
    );
  }

  const marketData = token.tokenData?.marketData;
  const links = token.tokenData?.links;
  const categories = token.tokenData?.categories;
  const communityData = token.tokenData?.communityData;
  const developerData = token.tokenData?.developerData;

  // 后端已经返回完整的 PriceChartData 格式，直接使用（market_chart在根层级）
  const priceChartData = token.tokenData?.priceChart?.price as PriceChartData | null | undefined;

  const formatLargeNumber = (value: number): string => {
    if (isNaN(value)) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number): { text: string; color: string; icon: React.ReactNode } => {
    if (isNaN(value)) return { text: 'N/A', color: 'text-muted-foreground', icon: null };
    const isPositive = value >= 0;
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const icon = isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />;
    return { text: `${isPositive ? '+' : ''}${value.toFixed(2)}%`, color, icon };
  };

  const price1h = formatPercentage(marketData?.priceChangePercentage1h || 0);
  const price24h = formatPercentage(marketData?.priceChangePercentage24h || 0);
  const price7d = formatPercentage(marketData?.priceChangePercentage7d || 0);
  const price30d = formatPercentage(marketData?.priceChangePercentage30d || 0);

  // 目录项
  const tocItems: TocItem[] = [
    { id: 'overview', title: 'Overview', level: 1 },
    { id: 'price', title: 'Price & Market Data', level: 1 },
    ...(priceChartData?.data?.length ? [{ id: 'price-chart', title: 'Price Chart', level: 1 }] : []),
    { id: 'health-score', title: 'Market Health Score', level: 1 },
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
              {token.image && (
                <Image
                  src={token.image}
                  alt={token.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-xl border border-border shrink-0"
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {token.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-medium text-muted-foreground">
                    {token.symbol?.toUpperCase()}
                  </span>
                  {token.tokenData?.marketCapRank && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      Rank #{token.tokenData.marketCapRank}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-muted/30 rounded-lg border border-border">
              <div className="animate-fade-in-up">
                <DataItem label="Current Price" value={`$${marketData?.currentPrice || 0}`} highlight />
              </div>
              <div className="animate-fade-in-up">
                <DataItem label="Market Cap" value={formatLargeNumber(marketData?.marketCap || 0)} />
              </div>
              <div className="animate-fade-in-up">
                <DataItem label="24h Volume" value={formatLargeNumber(marketData?.totalVolume || 0)} />
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
                  <p className="text-2xl font-bold text-foreground">{formatLargeNumber(marketData?.ath || 0)}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={cn("font-medium", formatPercentage(marketData?.athChangePercentage || 0).color)}>
                      {formatPercentage(marketData?.athChangePercentage || 0).text}
                    </span>
                    <span className="text-muted-foreground">
                      {marketData?.athDate && new Date(marketData.athDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-lg border border-border">
                <h3 className="text-sm font-medium text-muted-foreground">All-Time Low</h3>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-foreground">{formatLargeNumber(marketData?.atl || 0)}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={cn("font-medium", formatPercentage(marketData?.atlChangePercentage || 0).color)}>
                      {formatPercentage(marketData?.atlChangePercentage || 0).text}
                    </span>
                    <span className="text-muted-foreground">
                      {marketData?.atlDate && new Date(marketData.atlDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Market Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DataItem label="Fully Diluted Valuation" value={formatLargeNumber(marketData?.fullyDilutedValuation || 0)} />
                <DataItem label="24h High" value={formatLargeNumber(marketData?.high24h || 0)} />
                <DataItem label="24h Low" value={formatLargeNumber(marketData?.low24h || 0)} />
              </div>
            </div>
          </div>
        </section>

        {/* Price Chart Section */}
        {priceChartData && priceChartData.data && priceChartData.data.length > 0 && (
          <section id="price-chart" className="animate-fade-in-up">
            <SectionTitle id="price-chart">Price Chart (7d)</SectionTitle>
            <div className="p-6 rounded-lg border border-border bg-muted/10">
              <PriceChart priceData={priceChartData} />
            </div>
          </section>
        )}

        {/* Market Health Score Section */}
        <section id="health-score" className="animate-fade-in-up">
          <SectionTitle id="health-score">Market Health Score</SectionTitle>
          <div className="p-6 rounded-lg border border-border bg-muted/10">
            <EntityRadarChart scores={calculateTokenScores(token)} />
          </div>
        </section>

        {/* Supply Information Section */}
        <section id="supply" className="animate-fade-in-up">
          <SectionTitle id="supply">Supply Information</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataItem label="Circulating Supply" value={formatLargeNumber(marketData?.circulatingSupply || 0)} />
            <DataItem label="Total Supply" value={formatLargeNumber(marketData?.totalSupply || 0)} />
            {marketData?.maxSupply && (
              <DataItem label="Max Supply" value={formatLargeNumber(marketData.maxSupply)} />
            )}
          </div>
        </section>

        {/* Community & Development Section */}
        <section id="community" className="animate-fade-in-up">
          <SectionTitle id="community">Community & Development</SectionTitle>
          <div className="space-y-6">
            {/* Community Data */}
            {communityData && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Community</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {communityData.redditSubscribers > 0 && (
                    <DataItem label="Reddit Subscribers" value={communityData.redditSubscribers.toLocaleString()} />
                  )}
                  {communityData.telegramChannelUserCount && (
                    <DataItem label="Telegram Users" value={communityData.telegramChannelUserCount.toLocaleString()} />
                  )}
                  {communityData.redditAveragePosts48h > 0 && (
                    <DataItem label="Reddit Posts (48h)" value={communityData.redditAveragePosts48h.toFixed(1)} />
                  )}
                </div>
              </div>
            )}

            {/* Developer Data */}
            {developerData && developerData.forks > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Development Activity</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DataItem label="GitHub Stars" value={developerData.stars.toLocaleString()} />
                  <DataItem label="Forks" value={developerData.forks.toLocaleString()} />
                  <DataItem label="Contributors" value={developerData.pullRequestContributors.toLocaleString()} />
                  <DataItem label="Commits (4w)" value={developerData.commitCount4Weeks.toLocaleString()} />
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
            {(links?.homepage || links?.twitterScreenName) && (
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
                  {links.twitterScreenName && (
                    <a
                      href={`https://twitter.com/${links.twitterScreenName}`}
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
            {links?.blockchainSite && links.blockchainSite.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Blockchain Explorers</h3>
                <div className="flex flex-wrap gap-2">
                  {links.blockchainSite.slice(0, 3).map((site, idx) => (
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
