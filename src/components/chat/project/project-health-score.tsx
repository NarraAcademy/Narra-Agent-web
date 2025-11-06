"use client";

import { Badge } from "@/components/ui/badge";
import type { ProjectSpecificData } from "@/types/unified-entity";
import { InfoCircledIcon } from "@radix-ui/react-icons";

interface ProjectHealthScoreProps {
  data: ProjectSpecificData;
}

interface HealthAnalysis {
  score: number;
  pros: string[];
  cons: string[];
  timeline: Array<{
    date: string;
    direction: "UP" | "NEUTRAL" | "DOWN";
    description: string;
  }>;
}

/**
 * 计算项目健康度评分
 */
function calculateHealthScore(data: ProjectSpecificData): HealthAnalysis {
  let score = 0;
  const pros: string[] = [];
  const cons: string[] = [];

  // 1. 融资情况 (20分)
  if (data.totalFunding > 10000000) {
    score += 20;
    const formatted = `$${(data.totalFunding / 1000000).toFixed(1)}M`;
    pros.push(`Raised ${formatted} in funding from top-tier investors`);
  } else if (data.totalFunding > 1000000) {
    score += 15;
    const formatted = `$${(data.totalFunding / 1000000).toFixed(1)}M`;
    pros.push(`Secured ${formatted} in funding`);
  } else if (data.totalFunding > 0) {
    score += 10;
    const formatted = `$${(data.totalFunding / 1000).toFixed(0)}K`;
    pros.push(`Raised ${formatted} in early-stage funding`);
  } else {
    cons.push("No public funding information disclosed");
  }

  // 2. 社交影响力 (20分)
  const mainAccount = data.xAccounts?.[0];
  const followers = mainAccount?.followersCount || 0;

  if (followers > 100000) {
    score += 20;
    const formatted = (followers / 1000).toFixed(0);
    pros.push(`Strong social presence: ${formatted}K+ followers on X`);
  } else if (followers > 10000) {
    score += 15;
    const formatted = (followers / 1000).toFixed(0);
    pros.push(`Growing community: ${formatted}K followers on X`);
  } else if (followers > 1000) {
    score += 10;
    const formatted = (followers / 1000).toFixed(1);
    pros.push(`Active on X with ${formatted}K followers`);
  } else {
    cons.push("Limited social media presence and community engagement");
  }

  // 3. 交易所覆盖 (15分)
  const exchangeCount = data.exchanges?.length || 0;
  if (exchangeCount >= 5) {
    score += 15;
    pros.push(`Listed on ${exchangeCount} major exchanges, ensuring high liquidity`);
  } else if (exchangeCount >= 3) {
    score += 12;
    pros.push(`Available on ${exchangeCount} exchanges`);
  } else if (exchangeCount > 0) {
    score += 8;
    pros.push(`Listed on ${exchangeCount} exchange${exchangeCount > 1 ? "s" : ""}`);
  } else {
    cons.push("Limited exchange availability, reducing liquidity access");
  }

  // 4. 团队规模 (15分)
  const teamSize = data.teamMembers?.length || 0;
  if (teamSize >= 10) {
    score += 15;
    pros.push(`Strong team: ${teamSize} members with public profiles and expertise`);
  } else if (teamSize >= 5) {
    score += 12;
    pros.push(`${teamSize} team members with public profiles`);
  } else if (teamSize > 0) {
    score += 8;
    pros.push(`Core team of ${teamSize} members`);
  }

  // 5. 技术实现 (15分)
  const contractCount = data.contracts?.length || 0;
  if (contractCount >= 5) {
    score += 15;
    pros.push(`${contractCount} smart contracts deployed across multiple chains`);
  } else if (contractCount >= 3) {
    score += 12;
    pros.push(`${contractCount} smart contracts deployed`);
  } else if (contractCount > 0) {
    score += 8;
    pros.push(`${contractCount} contract${contractCount > 1 ? "s" : ""} deployed`);
  }

  // 6. 活跃度 - 最近新闻 (15分)
  const recentNews = (data.news || []).filter((n) => {
    if (!n.publish_time) return false;
    const publishDate = new Date(n.publish_time);
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    return publishDate > threeMonthsAgo;
  });

  if (recentNews.length >= 10) {
    score += 15;
    pros.push(`High media visibility: ${recentNews.length} recent news articles`);
  } else if (recentNews.length >= 5) {
    score += 12;
    pros.push(`Active media coverage: ${recentNews.length} recent articles`);
  } else if (recentNews.length > 0) {
    score += 8;
    pros.push(`Recent media coverage with ${recentNews.length} article${recentNews.length > 1 ? "s" : ""}`);
  } else {
    cons.push("No recent news updates in the past 3 months");
  }

  // 额外的 Cons 检查
  const hasToken = data.tokens && data.tokens.length > 0;
  if (hasToken && data.tokens) {
    const token = data.tokens[0];
    if (!token.market_cap && !token.price) {
      cons.push("Incomplete tokenomics and market data available");
    }
  }

  // 检查最近的里程碑更新
  const latestEvent = data.events?.[0];
  if (latestEvent?.date) {
    const daysSinceUpdate =
      (Date.now() - new Date(latestEvent.date).getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceUpdate > 90) {
      cons.push("No recent milestone updates in the past 3 months");
    }
  }

  // 时间线 - 最近的 5 个事件
  const timeline = (data.events || [])
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5)
    .map((event) => {
      const eventDate = event.date ? new Date(event.date) : new Date(0);
      const daysSince = (Date.now() - eventDate.getTime()) / (24 * 60 * 60 * 1000);

      let direction: "UP" | "NEUTRAL" | "DOWN" = "NEUTRAL";
      if (daysSince < 30) {
        direction = "UP";
      } else if (daysSince > 90) {
        direction = "DOWN";
      }

      return {
        date: eventDate.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        direction,
        description: event.title,
      };
    });

  return {
    score: Math.min(score, 100),
    pros,
    cons,
    timeline,
  };
}

export function ProjectHealthScore({ data }: ProjectHealthScoreProps) {
  const analysis = calculateHealthScore(data);

  return (
    <div className="border border-border rounded-lg bg-card/50 p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Project Health Score
        </h3>
        <InfoCircledIcon className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Score Display */}
      <div className="mb-2">
        <div className="text-5xl font-bold text-foreground">
          {analysis.score}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full mb-8">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${analysis.score}%` }}
        />
      </div>

      {/* Pros & Cons Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Pros */}
        <div>
          <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3">
            Pros
          </h4>
          {analysis.pros.length > 0 ? (
            <ul className="space-y-2">
              {analysis.pros.map((pro, index) => (
                <li
                  key={index}
                  className="text-sm text-foreground/80 leading-relaxed flex items-start gap-2"
                >
                  <span className="text-green-600 dark:text-green-400 mt-0.5">
                    •
                  </span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No positive indicators found
            </p>
          )}
        </div>

        {/* Cons */}
        <div>
          <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
            Cons
          </h4>
          {analysis.cons.length > 0 ? (
            <ul className="space-y-2">
              {analysis.cons.map((con, index) => (
                <li
                  key={index}
                  className="text-sm text-foreground/80 leading-relaxed flex items-start gap-2"
                >
                  <span className="text-red-600 dark:text-red-400 mt-0.5">
                    •
                  </span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No concerns identified
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      {analysis.timeline.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">
            Recent Milestones
          </h4>
          <div className="space-y-3">
            {analysis.timeline.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-sm"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <span className="text-muted-foreground min-w-[90px] text-xs">
                  {event.date}
                </span>
                <Badge
                  variant={
                    event.direction === "UP"
                      ? "default"
                      : event.direction === "DOWN"
                        ? "destructive"
                        : "secondary"
                  }
                  className="min-w-[70px] justify-center"
                >
                  {event.direction}
                </Badge>
                <span className="flex-1 text-foreground/80 leading-relaxed">
                  {event.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
