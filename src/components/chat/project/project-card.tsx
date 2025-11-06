"use client";

import { useProjectDetail } from "@/hooks/use-project-detail";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { CyberScoreChart } from "./cyber-score-chart";
import { PriceChart } from "../price-chart";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { ProjectDetail } from "@/types/entity";

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

interface ProjectCardProps {
  entity: string;
}

/**
 * 骨架屏组件
 */
function ProjectCardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 头部：Logo + 标题 */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-5 bg-muted rounded w-2/3" />
          <div className="flex gap-1">
            <div className="h-5 w-16 bg-muted rounded" />
            <div className="h-5 w-16 bg-muted rounded" />
          </div>
        </div>
      </div>

      {/* 价格趋势图骨架 */}
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex items-baseline justify-between">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="h-4 bg-muted rounded w-8" />
        </div>
        <div className="w-full h-16 bg-muted rounded" />
      </div>

      {/* Cyber Score图表 + 关键指标 */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
        {/* 左侧：Cyber Score */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-muted" />
        </div>

        {/* 右侧：关键指标 */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-5 bg-muted rounded w-3/4" />
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-5 bg-muted rounded w-3/4" />
          </div>
        </div>
      </div>

      {/* 描述 */}
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </div>

      {/* 链接 */}
      <div className="flex gap-2 pt-3 border-t border-border">
        <div className="h-8 w-20 bg-muted rounded" />
      </div>
    </div>
  );
}

/**
 * 项目详情卡片组件 - 完整版
 * 展示：Cyber Score图表 + 描述 + 图片 + 关键指标
 */
export function ProjectCard({ entity }: ProjectCardProps) {
  const { data, isLoading, error } = useProjectDetail(entity);

  // 加载中 - 显示骨架屏
  if (isLoading) {
    return <ProjectCardSkeleton />;
  }

  // 错误或无数据
  if (error || !data) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Failed to load project details
      </div>
    );
  }

  // 获取主要的X账号信息
  const mainXAccount = data.projectData?.xAccounts?.[0];
  const cyberScore = mainXAccount?.cyberScore;

  // 格式化数字 - 资金用$前缀，其他不用
  const formatMoney = (num: number): string => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num}`;
  };

  const formatCount = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // 获取网站链接
  const websiteLink = data.projectData?.links?.find(link => link.type === 'web')?.value;

  // 获取价格图表数据 (后端已经返回完整的 PriceChartData 格式)
  const priceChartData = data.projectData?.priceChart?.price as PriceChartData | null | undefined;

  return (
    <div className="space-y-4 text-sm max-w-[400px]">
      {/* 头部：Logo + 标题 + Tags */}
      <div className="flex items-start gap-3">
        {data.image && (
          <Image
            src={typeof data.image === 'string' ? data.image : (data.image as any).large}
            alt={data.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base text-foreground truncate">
            {data.name}
          </h4>
          {data.projectData?.tags && data.projectData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {data.projectData.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-0 h-5"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 价格趋势图 */}
      {priceChartData && priceChartData.data && priceChartData.data.length > 0 && (
        <div className="pt-3 border-t border-border">
          <PriceChart priceData={priceChartData} />
        </div>
      )}

      {/* Cyber Score图表 + 关键指标 */}
      {cyberScore && (
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
          {/* 左侧：Cyber Score环形图 */}
          <div className="flex justify-center items-center">
            <CyberScoreChart
              score={cyberScore.score}
              percentile={cyberScore.percentile}
            />
          </div>

          {/* 右侧：关键指标 */}
          <div className="space-y-3 flex flex-col justify-center">
            {/* 融资额 */}
            {data.projectData?.totalFunding && data.projectData.totalFunding > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Funding</p>
                <p className="font-semibold text-foreground">
                  {formatMoney(data.projectData.totalFunding)}
                </p>
              </div>
            )}

            {/* Twitter粉丝 */}
            {mainXAccount?.followersCount && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Followers</p>
                <p className="font-semibold text-foreground">
                  {formatCount(mainXAccount.followersCount)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 描述 */}
      {data.description && (
        <div className="pt-3 border-t border-border">
          <p className="text-foreground/80 leading-relaxed line-clamp-3">
            {data.description}
          </p>
        </div>
      )}

      {/* 链接 */}
      {websiteLink && (
        <div className="flex gap-2 pt-3 border-t border-border">
          <a
            href={websiteLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md",
              "text-xs font-medium",
              "bg-primary/10 text-primary hover:bg-primary/20",
              "transition-colors"
            )}
          >
            <ExternalLinkIcon className="w-3.5 h-3.5" />
            Website
          </a>
        </div>
      )}
    </div>
  );
}
