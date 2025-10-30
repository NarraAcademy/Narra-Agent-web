"use client";

import useSWR from "swr";
import { ExternalLinkIcon, ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { TokenDetail, ApiResponse, BackendTokenResponse } from "@/types/entity";

interface TokenCardProps {
  entity: string;
}

/**
 * 骨架屏组件
 */
function TokenCardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse max-w-[400px]">
      {/* 头部：Logo + 基本信息 */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-5 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
      </div>

      {/* 价格和市值信息 */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
        <div className="space-y-1">
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-6 bg-muted rounded w-3/4" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-5 bg-muted rounded w-3/4" />
        </div>
      </div>

      {/* 涨跌幅 */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <div className="h-6 bg-muted rounded w-16" />
        <div className="h-6 bg-muted rounded w-16" />
        <div className="h-6 bg-muted rounded w-16" />
      </div>
    </div>
  );
}

/**
 * 错误状态组件
 */
function TokenCardError({ entity }: { entity: string }) {
  return (
    <div className="text-sm text-muted-foreground max-w-[400px]">
      <p>Failed to load details for &quot;{entity}&quot;</p>
    </div>
  );
}

/**
 * 格式化大数字（市值、交易量等）
 */
function formatLargeNumber(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

/**
 * 格式化百分比变化
 */
function formatPercentage(value: string): { text: string; color: string; icon: React.ReactNode } {
  const num = parseFloat(value);
  if (isNaN(num)) return { text: 'N/A', color: 'text-muted-foreground', icon: null };

  const isPositive = num >= 0;
  const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const icon = isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />;
  const text = `${isPositive ? '+' : ''}${num.toFixed(2)}%`;
  return { text, color, icon };
}

/**
 * Token卡片内容组件
 */
function TokenCardContent({ token }: { token: TokenDetail }) {
  const { market_data, links, categories } = token;

  const price24h = formatPercentage(market_data.price_change_percentage_24h);
  const price7d = formatPercentage(market_data.price_change_percentage_7d);
  const price30d = formatPercentage(market_data.price_change_percentage_30d);

  return (
    <div className="space-y-3 text-sm max-w-[400px]">
      {/* 头部：Logo + 基本信息 */}
      <div className="flex items-start gap-3">
        <img
          src={token.image.large}
          alt={token.name}
          className="w-12 h-12 rounded-full border border-border shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base text-foreground truncate">
            {token.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium text-muted-foreground">
              {token.symbol.toUpperCase()}
            </span>
            {token.market_cap_rank && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Rank #{token.market_cap_rank}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 价格和市值 */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="text-lg font-bold text-foreground">
            ${market_data.current_price}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Market Cap</p>
          <p className="text-base font-semibold text-foreground">
            {formatLargeNumber(market_data.market_cap)}
          </p>
        </div>
      </div>

      {/* 涨跌幅 */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <div className={cn("flex items-center gap-1 px-2 py-1 rounded", price24h.color, "bg-muted/30")}>
          {price24h.icon}
          <span className="text-xs font-medium">24h {price24h.text}</span>
        </div>
        <div className={cn("flex items-center gap-1 px-2 py-1 rounded", price7d.color, "bg-muted/30")}>
          {price7d.icon}
          <span className="text-xs font-medium">7d {price7d.text}</span>
        </div>
        <div className={cn("flex items-center gap-1 px-2 py-1 rounded", price30d.color, "bg-muted/30")}>
          {price30d.icon}
          <span className="text-xs font-medium">30d {price30d.text}</span>
        </div>
      </div>

      {/* 交易量和供应量 */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">24h Volume</p>
          <p className="text-sm font-medium text-foreground">
            {formatLargeNumber(market_data.total_volume)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Circulating Supply</p>
          <p className="text-sm font-medium text-foreground">
            {formatLargeNumber(market_data.circulating_supply)}
          </p>
        </div>
      </div>

      {/* Categories（最多显示3个） */}
      {categories && categories.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Categories</p>
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 链接 */}
      {(links.homepage || links.twitter_screen_name) && (
        <div className="flex gap-2 pt-2 border-t border-border">
          {links.homepage && (
            <a
              href={links.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Website
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
          )}
          {links.twitter_screen_name && (
            <a
              href={`https://twitter.com/${links.twitter_screen_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Twitter
              <ExternalLinkIcon className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Token卡片主组件
 */
export function TokenCard({ entity }: TokenCardProps) {
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json: ApiResponse<BackendTokenResponse> = await response.json();
    if (json.code !== 0) {
      throw new Error(json.message || 'Failed to fetch token details');
    }
    return json.data.data; // 解包 BackendTokenResponse 的 data 字段
  };

  const { data: token, error, isLoading } = useSWR<TokenDetail>(
    `/api/services/token?token=${encodeURIComponent(entity)}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (isLoading) return <TokenCardSkeleton />;
  if (error || !token) return <TokenCardError entity={entity} />;

  return <TokenCardContent token={token} />;
}
