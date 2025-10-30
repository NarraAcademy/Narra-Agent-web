"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import type {
  SearchResultItem,
  SearchProjectsResponse,
  SearchTokensResponse,
  ApiResponse,
} from "@/types/entity";

/**
 * 搜索自动补全组件
 */
export function SearchAutocomplete() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("analytics");
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // 是否应该搜索 (至少2个字符)
  const shouldSearch = query.length >= 2;

  // 获取项目搜索结果（包含tokens，因为有些项目本身就是token）
  // 使用 SWR 的 dedupingInterval 来实现防抖效果
  const { data: projectsData, isLoading } = useSWR<ApiResponse<SearchProjectsResponse>>(
    shouldSearch ? `/api/search-projects?query=${encodeURIComponent(query)}` : null,
    (url: string) => fetch(url).then((res) => res.json()),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300, // 300ms 防抖
    }
  );

  // 合并和格式化搜索结果
  const searchResults = useMemo((): SearchResultItem[] => {
    const results: SearchResultItem[] = [];

    // 获取项目结果
    const projects = projectsData?.data?.data?.projects || [];

    projects.forEach((project) => {
      // 根据是否有symbol和price判断是token还是普通项目
      const isToken = project.symbol && project.price;

      results.push({
        type: isToken ? 'token' : 'project',
        id: isToken ? (project.symbol || project.name) : project.name,
        name: project.name,
        symbol: project.symbol,
        logo: project.logo,
        price: project.price,
        market_cap: project.market_cap,
        priceChange: null,
        heat: project.heat,
        tags: project.tags || [],
      });
    });

    // 最多返回4条
    return results.slice(0, 4);
  }, [projectsData]);

  // 根据tag文本生成颜色
  const getTagColor = (tag: string): string => {
    // 使用tag的hashCode生成稳定的颜色
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  // 格式化价格
  const formatPrice = (value: string | null): string => {
    if (!value) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return `$${num.toFixed(num < 1 ? 4 : 2)}`;
  };

  // 处理结果项点击
  const handleResultClick = (result: SearchResultItem) => {
    if (result.type === 'project') {
      router.push(`/${locale}/analytics/detail/project?entity=${encodeURIComponent(result.id)}`);
    } else {
      router.push(`/${locale}/analytics/detail/token?token=${encodeURIComponent(result.id)}`);
    }
    setQuery("");
    setIsFocused(false);
  };

  // 是否显示下拉列表
  const showDropdown = isFocused && shouldSearch && searchResults.length > 0;
  const showLoading = isFocused && shouldSearch && isLoading;
  const showNoResults = isFocused && shouldSearch && !isLoading && searchResults.length === 0;

  return (
    <div className="relative w-full">
      {/* 搜索框 */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder={t("search_placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // 延迟关闭以允许点击下拉列表
            setTimeout(() => setIsFocused(false), 200);
          }}
          className="pl-12 rounded-xl pr-4 h-12 text-base"
        />
      </div>

      {/* 下拉结果列表 */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {searchResults.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors border-b border-border last:border-b-0"
            >
              {/* Logo */}
              <img
                src={result.logo}
                alt={result.name}
                className="w-10 h-10 rounded-full shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">
                    {result.symbol ? `$${result.symbol}` : result.name}
                  </span>
                  {result.type === 'project' && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Project
                    </span>
                  )}
                  {result.type === 'token' && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Token
                    </span>
                  )}
                </div>
                {result.symbol && result.name !== result.symbol && (
                  <p className="text-sm text-muted-foreground truncate">
                    {result.name}
                  </p>
                )}
                {/* Tags显示 */}
                {(result as any).tags && (result as any).tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(result as any).tags.slice(0, 2).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          getTagColor(tag)
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 价格或热度信息 */}
              <div className="text-right shrink-0">
                {result.price ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">
                      {formatPrice(result.price)}
                    </p>
                    {result.priceChange && (
                      <p className={cn(
                        "text-xs font-medium",
                        parseFloat(result.priceChange) >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {parseFloat(result.priceChange) >= 0 ? '+' : ''}
                        {parseFloat(result.priceChange).toFixed(2)}%
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Heat: {(result as any).heat || 0}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 加载骨架屏 */}
      {showLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0"
            >
              {/* Logo骨架 */}
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />

              {/* 信息骨架 */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-32" />
                <div className="h-3 bg-muted rounded animate-pulse w-24" />
              </div>

              {/* 右侧骨架 */}
              <div className="text-right shrink-0 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 无结果提示 */}
      {showNoResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
          {t("no_results")}
        </div>
      )}
    </div>
  );
}
