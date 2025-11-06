"use client";

import { useProjectDetail } from "@/hooks/use-project-detail";
import { ExternalLinkIcon, CopyIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn, hasValue } from "@/lib/utils";
import { useState } from "react";
import { CyberScoreChart } from "./cyber-score-chart";
import { PriceChart } from "../price-chart";
import { ProjectHealthScore } from "./project-health-score";
import { Badge } from "@/components/ui/badge";
import { TableOfContents, type TocItem } from "../table-of-contents";
import type { UnifiedEntityDetail } from "@/types/unified-entity";
import { EntityRadarChart } from "@/components/ui/entity-radar-chart";
import { calculateProjectScores } from "@/utils/entity-scores";
import { Globe, FileText } from "lucide-react";
import Image from "next/image";
import {
  FaXTwitter,
  FaGithub,
  FaFacebook,
  FaTelegram,
  FaDiscord,
  FaMedium,
} from "react-icons/fa6";

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
function ProjectDetailSkeleton() {
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
function SectionTitle({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
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
function DataItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="  flex items-center space-x-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-semibold", "text-base", "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

/**
 * 获取社交链接图标
 */
function getLinkIcon(type: string) {
  const iconMap: Record<string, React.ReactNode> = {
    web: <Globe className="w-4 h-4" />,
    twitter: <FaXTwitter className="w-4 h-4" />,
    x: <FaXTwitter className="w-4 h-4" />,
    telegram: <FaTelegram className="w-4 h-4" />,
    discord: <FaDiscord className="w-4 h-4" />,
    github: <FaGithub className="w-4 h-4" />,
    facebook: <FaFacebook className="w-4 h-4" />,
    medium: <FaMedium className="w-4 h-4" />,
    whitepaper: <FileText className="w-4 h-4" />,
  };

  return (
    iconMap[type.toLowerCase()] || <ExternalLinkIcon className="w-4 h-4" />
  );
}

/**
 * 获取链接显示文本
 */
function getLinkLabel(type: string) {
  const labelMap: Record<string, string> = {
    web: "Website",
    twitter: "Twitter",
    x: "X",
    telegram: "Telegram",
    discord: "Discord",
    github: "GitHub",
    facebook: "Facebook",
    medium: "Medium",
    whitepaper: "Whitepaper",
  };

  return labelMap[type.toLowerCase()] || type;
}

/**
 * 复制按钮组件
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-muted rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckIcon className="w-4 h-4 text-green-500" />
      ) : (
        <CopyIcon className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
}

/**
 * 项目详情内容组件 - 章节化布局
 */
export function ProjectDetailContent({
  entity,
  showToc,
}: {
  entity: string;
  showToc: boolean;
}) {
  const { data, isLoading, error } = useProjectDetail(entity);

  if (isLoading) return <ProjectDetailSkeleton />;
  if (error || !data) {
    return (
      <div className="text-sm text-muted-foreground text-center py-16">
        Failed to load project details
      </div>
    );
  }

  const mainXAccount = data.projectData?.xAccounts?.[0];
  const cyberScore = mainXAccount?.cyberScore;
  // 后端已经返回完整的 PriceChartData 格式，直接使用
  const priceChartData = data.projectData?.priceChart?.price as
    | PriceChartData
    | null
    | undefined;

  const formatMoney = (num: number): string => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num}`;
  };

  const formatCount = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const tocItems: TocItem[] = [
    { id: "overview", title: "Overview", level: 1 },
    ...(data.projectData?.tokens && data.projectData.tokens.length > 0
      ? [{ id: "tokens", title: "Token Information", level: 1 }]
      : []),
    ...(priceChartData?.data?.length
      ? [{ id: "price", title: "Price Chart", level: 1 }]
      : []),
    ...(data.projectData
      ? [{ id: "health", title: "Health Score", level: 1 }]
      : []),
    ...((data.projectData?.news.length ?? 0) > 0
      ? [{ id: "news", title: "News", level: 1 }]
      : []),
    ...((data.projectData?.teamMembers.length ?? 0) > 0
      ? [{ id: "team", title: "Team Members", level: 1 }]
      : []),
    ...(cyberScore
      ? [{ id: "social", title: "Social Metrics", level: 1 }]
      : []),
    ...((data.projectData?.contracts.length ?? 0) > 0
      ? [{ id: "contracts", title: "Contracts", level: 1 }]
      : []),
    ...((data.projectData?.exchanges.length ?? 0) > 0
      ? [{ id: "exchanges", title: "Exchanges", level: 1 }]
      : []),
    ...((data.projectData?.similarProjects.length ?? 0) > 0
      ? [{ id: "similar", title: "Similar Projects", level: 1 }]
      : []),
    { id: "about", title: "About", level: 1 },
    { id: "links", title: "Links", level: 1 },
  ];

  return (
    <div>
      <div className="">
        <div className="flex gap-8 items-start">
          {/* Left Side (60%) */}
          <div className="flex-[3] space-y-6">
            {/* Logo + Name + Tags */}
            <div className="flex items-start gap-6">
              {data.image && (
                <Image
                  src={
                    typeof data.image === "string"
                      ? data.image
                      : (data.image as any).large
                  }
                  alt={data.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-xl object-cover border border-border shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-3">
                  {data.name}
                </h1>
                {(data.projectData?.tags.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.projectData?.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm px-3 py-1"
                        style={{
                          animationDelay: `${0.2 + index * 0.05}s`,
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <section id="about">
              {data.description && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-foreground/90 leading-relaxed">
                    {data.description}
                  </p>
                </div>
              )}
            </section>

            {/* Key Metrics Grid */}
            <div className=" flex items-center space-x-8">
              {data.projectData?.keyMetrics.map((metric, index) => (
                <DataItem
                  key={index}
                  label={metric.label}
                  value={metric.value}
                />
              ))}
            </div>

            {/* Links */}
            <section id="links">
              {(data.projectData?.links.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-3">
                  {data.projectData?.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-md",
                        "text-sm font-medium",
                        "bg-primary/10 text-primary hover:bg-primary/20",
                        "transition-all duration-300 hover:scale-105 hover:shadow-md"
                      )}
                      style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                    >
                      {getLinkIcon(link.type)}
                      {getLinkLabel(link.type)}
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Side (40%) - Radar Chart */}
          <div className="flex-[2] flex items-start justify-center">
            <EntityRadarChart scores={calculateProjectScores(data)} />
          </div>
        </div>
      </div>
      <div className="flex gap-12">
        <div className="flex-1 min-w-0 space-y-12">
          {/* Price Chart Section */}
          {priceChartData && (
            <section id="price" className="animate-fade-in-up">
              <SectionTitle id="price">Price Chart (7d)</SectionTitle>
              <div className="p-6 rounded-lg border border-border bg-muted/10">
                <PriceChart priceData={priceChartData} />
              </div>
            </section>
          )}

          {/* Project Health Score - 替代原 Events & Milestones */}
          {data.projectData && (
            <section id="health" className="animate-fade-in-up">
              <ProjectHealthScore data={data.projectData} />
            </section>
          )}

          {/* News Section */}
          {(data.projectData?.news.length ?? 0) > 0 && (
            <section id="news" className="animate-fade-in-up">
              <SectionTitle id="news">News</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.projectData?.news.map((article, index) => (
                  <a
                    key={index}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 hover:border-primary/50 transition-all duration-300"
                    style={{ animationDelay: `${0.65 + index * 0.05}s` }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <ExternalLinkIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {article.source && <span>{article.source}</span>}
                        {article.publish_time && (
                          <span>
                            {new Date(
                              article.publish_time
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Team Members Section */}
          {(data.projectData?.teamMembers.length ?? 0) > 0 && (
            <section id="team" className="animate-fade-in-up">
              <SectionTitle id="team">Team Members</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.projectData?.teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border bg-muted/10"
                    style={{ animationDelay: `${0.7 + index * 0.05}s` }}
                  >
                    <div className="flex items-start gap-3">
                      {member.avatar && (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-full border border-border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {member.name}
                        </h3>
                        {member.title && (
                          <p className="text-sm text-muted-foreground">
                            {member.title}
                          </p>
                        )}
                        {(member.linkedin || member.twitter) && (
                          <div className="flex items-center gap-2 mt-2">
                            {member.linkedin && (
                              <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors"
                              >
                                <ExternalLinkIcon className="w-4 h-4" />
                              </a>
                            )}
                            {member.twitter && (
                              <a
                                href={member.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors"
                              >
                                <ExternalLinkIcon className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Social Metrics Section */}
          {cyberScore && (
            <section id="social" className="animate-fade-in-up">
              <SectionTitle id="social">Social Metrics</SectionTitle>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Cyber Score */}
                <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-border bg-muted/10">
                  <CyberScoreChart
                    score={cyberScore.score}
                    percentile={cyberScore.percentile}
                  />
                </div>

                {/* X Account Details */}
                {mainXAccount && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                      X Account Details
                    </h3>
                    <div className="flex items-center gap-3 mb-4">
                      {mainXAccount.profileImage && (
                        <img
                          src={mainXAccount.profileImage}
                          alt={mainXAccount.displayName}
                          className="w-12 h-12 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">
                          {mainXAccount.displayName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{mainXAccount.handle}
                        </p>
                      </div>
                    </div>
                    {mainXAccount.description && (
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {mainXAccount.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Contracts Section */}
          {(data.projectData?.contracts.length ?? 0) > 0 && (
            <section id="contracts" className="animate-fade-in-up">
              <SectionTitle id="contracts">Contracts</SectionTitle>
              <div className="space-y-2">
                {data.projectData?.contracts.map((contract, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border bg-muted/10"
                    style={{ animationDelay: `${0.8 + index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {contract.chain && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {contract.chain}:
                        </span>
                      )}
                      <span className="text-sm font-mono text-foreground truncate">
                        {contract.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <CopyButton text={contract.address} />
                      {contract.explorer_url && (
                        <a
                          href={contract.explorer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="View on explorer"
                        >
                          <ExternalLinkIcon className="w-4 h-4 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Exchanges Section */}
          {(data.projectData?.exchanges.length ?? 0) > 0 &&
            (() => {
              const validExchanges = data.projectData?.exchanges.filter(
                (exchange) => {
                  const exchangeName =
                    typeof exchange === "string" ? exchange : exchange.name;
                  return exchangeName && exchangeName.trim() !== "";
                }
              );

              if (!validExchanges || validExchanges.length === 0) return null;

              return (
                <section id="exchanges" className="animate-fade-in-up">
                  <SectionTitle id="exchanges">Exchanges</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {validExchanges.map((exchange, index) => {
                      const exchangeName =
                        typeof exchange === "string" ? exchange : exchange.name;
                      const exchangeLogo =
                        typeof exchange === "object"
                          ? exchange.logo
                          : undefined;

                      return (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                          style={{ animationDelay: `${0.85 + index * 0.01}s` }}
                        >
                          {exchangeLogo && exchangeLogo.trim() !== "" && (
                            <img
                              src={exchangeLogo}
                              alt={exchangeName}
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          <span className="text-sm text-foreground">
                            {exchangeName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })()}

          {/* Similar Projects Section */}
          {(data.projectData?.similarProjects.length ?? 0) > 0 &&
            (() => {
              const validProjects = data.projectData?.similarProjects.filter(
                (project) => {
                  const projectName =
                    typeof project === "string" ? project : project.name;
                  return projectName && projectName.trim() !== "";
                }
              );

              if (!validProjects || validProjects.length === 0) return null;

              return (
                <section id="similar" className="animate-fade-in-up">
                  <SectionTitle id="similar">Similar Projects</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {validProjects.map((project, index) => {
                      const projectName =
                        typeof project === "string" ? project : project.name;
                      const projectLogo =
                        typeof project === "object" ? project.logo : undefined;
                      const projectTags =
                        typeof project === "object" ? project.tags : undefined;

                      return (
                        <a
                          key={index}
                          href={`/analytics/detail/project?entity=${encodeURIComponent(
                            projectName
                          )}`}
                          className="group p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 hover:border-primary/50 transition-all duration-300"
                          style={{ animationDelay: `${0.9 + index * 0.05}s` }}
                        >
                          <div className="flex items-start gap-3">
                            {projectLogo && projectLogo.trim() !== "" && (
                              <img
                                src={projectLogo}
                                alt={projectName}
                                className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {projectName}
                              </h3>
                              {projectTags && projectTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {projectTags
                                    .slice(0, 2)
                                    .map((tag, tagIndex) => (
                                      <Badge
                                        key={tagIndex}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </section>
              );
            })()}
        </div>

        {/* Table of Contents */}
        {showToc && <TableOfContents items={tocItems} />}
      </div>
    </div>
  );
}
