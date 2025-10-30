"use client";

import { useProjectDetail } from "@/hooks/use-project-detail";
import { ExternalLinkIcon, CopyIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn, hasValue } from "@/lib/utils";
import { useState } from "react";
import { CyberScoreChart } from "./cyber-score-chart";
import { PriceChart } from "../price-chart";
import { Badge } from "@/components/ui/badge";
import { TableOfContents, type TocItem } from "../table-of-contents";
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
export function ProjectDetailContent({ entity, showToc }: { entity: string; showToc: boolean }) {
  const { data, isLoading, error } = useProjectDetail(entity) as {
    data: ProjectDetail | null;
    isLoading: boolean;
    error: Error | null;
  };

  if (isLoading) return <ProjectDetailSkeleton />;
  if (error || !data) {
    return (
      <div className="text-sm text-muted-foreground text-center py-16">
        Failed to load project details
      </div>
    );
  }

  const mainXAccount = data.x_accounts?.[0];
  const cyberScore = mainXAccount?.cyber_score;
  // 后端已经返回完整的 PriceChartData 格式，直接使用
  const priceChartData = data.coingecko_data?.market_chart?.price as PriceChartData | null | undefined;

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
    { id: 'overview', title: 'Overview', level: 1 },
    ...(data.tokens && data.tokens.length > 0 ? [{ id: 'tokens', title: 'Token Information', level: 1 }] : []),
    ...(priceChartData?.data?.length ? [{ id: 'price', title: 'Price Chart', level: 1 }] : []),
    ...(data.events && data.events.length > 0 ? [{ id: 'events', title: 'Events & Milestones', level: 1 }] : []),
    ...(data.news && data.news.length > 0 ? [{ id: 'news', title: 'News', level: 1 }] : []),
    ...(data.team_members && data.team_members.length > 0 ? [{ id: 'team', title: 'Team Members', level: 1 }] : []),
    ...(cyberScore ? [{ id: 'social', title: 'Social Metrics', level: 1 }] : []),
    ...(data.contracts && data.contracts.length > 0 ? [{ id: 'contracts', title: 'Contracts', level: 1 }] : []),
    ...(data.exchanges && data.exchanges.length > 0 ? [{ id: 'exchanges', title: 'Exchanges', level: 1 }] : []),
    ...(data.similar_projects && data.similar_projects.length > 0 ? [{ id: 'similar', title: 'Similar Projects', level: 1 }] : []),
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
              {data.image && (
                <img
                  src={data.image}
                  alt={data.name}
                  className="w-20 h-20 rounded-xl object-cover border border-border shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-3">
                  {data.name}
                </h1>
                {data.tags && data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm px-3 py-1"
                        style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hasValue(data.total_funding) && (
                <div className="p-4 rounded-lg border border-border bg-muted/20">
                  <DataItem label="Total Funding" value={formatMoney(data.total_funding)} highlight />
                </div>
              )}
              {hasValue(mainXAccount?.followers_count) && (
                <div className="p-4 rounded-lg border border-border bg-muted/20">
                  <DataItem label="X Followers" value={formatCount(mainXAccount.followers_count)} highlight />
                </div>
              )}
              {hasValue(mainXAccount?.smart_followers_count) && (
                <div className="p-4 rounded-lg border border-border bg-muted/20">
                  <DataItem label="Smart Followers" value={formatCount(mainXAccount.smart_followers_count)} highlight />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Token Information Section */}
        {data.tokens && data.tokens.length > 0 && (
          <section id="tokens" className="animate-fade-in-up">
            <SectionTitle id="tokens">Token Information</SectionTitle>
            <div className="space-y-6">
              {data.tokens.map((token, index) => {

                  // 适配API返回的嵌套结构: token可能有market_data或直接有扁平字段
                  const tokenData = (token as any);
                  const marketData = tokenData.market_data;

                  // 优先使用market_data中的值，fallback到token直接字段
                  const price = marketData?.price ? parseFloat(marketData.price) : tokenData.price;
                  const marketCap = marketData?.market_cap ? parseFloat(marketData.market_cap) : tokenData.market_cap;
                  const volume24h = marketData?.volume_24h ? parseFloat(marketData.volume_24h) : tokenData.volume_24h;
                  const logo = tokenData.image || tokenData.logo;

                  const formatPrice = (price: number) => {
                    if (price >= 1) return `$${price.toFixed(2)}`;
                    if (price >= 0.01) return `$${price.toFixed(4)}`;
                    return `$${price.toFixed(8)}`;
                  };

                  return (
                    <div key={index} className="p-6 rounded-lg border border-border bg-muted/10" style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
                      <div className="flex items-start gap-4 mb-6">
                        {logo && (
                          <img
                            src={logo}
                            alt={tokenData.name}
                            className="w-16 h-16 rounded-full border border-border"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-foreground mb-1">{tokenData.name}</h3>
                          {tokenData.symbol && <p className="text-muted-foreground">{tokenData.symbol}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {hasValue(price) && (
                          <DataItem label="Price" value={formatPrice(price)} highlight />
                        )}
                        {hasValue(marketCap) && (
                          <DataItem label="Market Cap" value={formatMoney(marketCap)} />
                        )}
                        {hasValue(volume24h) && (
                          <DataItem label="24h Volume" value={formatMoney(volume24h)} />
                        )}
                        {hasValue(tokenData.holders) && (
                          <DataItem label="Holders" value={formatCount(tokenData.holders)} />
                        )}
                      </div>

                    {tokenData.contract_address && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">Contract Address</p>
                            <p className="text-sm font-mono text-foreground truncate">{tokenData.contract_address}</p>
                          </div>
                          <CopyButton text={tokenData.contract_address} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Price Chart Section */}
        {priceChartData && (
          <section id="price" className="animate-fade-in-up">
            <SectionTitle id="price">Price Chart (7d)</SectionTitle>
            <div className="p-6 rounded-lg border border-border bg-muted/10">
              <PriceChart priceData={priceChartData} />
            </div>
          </section>
        )}

        {/* Events & Milestones Section */}
        {data.events && data.events.length > 0 && (
          <section id="events" className="animate-fade-in-up">
            <SectionTitle id="events">Events & Milestones</SectionTitle>
            <div className="relative space-y-4">
              {/* Timeline line */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

              {data.events.map((event, index) => (
                <div key={index} className="relative pl-8" style={{ animationDelay: `${0.6 + index * 0.05}s` }}>
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />

                  <div className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      {event.date && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-foreground/80 leading-relaxed">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* News Section */}
        {data.news && data.news.length > 0 && (
          <section id="news" className="animate-fade-in-up">
            <SectionTitle id="news">News</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.news.map((article, index) => (
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
                        <span>{new Date(article.publish_time).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Team Members Section */}
        {data.team_members && data.team_members.length > 0 && (
          <section id="team" className="animate-fade-in-up">
            <SectionTitle id="team">Team Members</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.team_members.map((member, index) => (
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
                      <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                      {member.title && (
                        <p className="text-sm text-muted-foreground">{member.title}</p>
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
                <CyberScoreChart score={cyberScore.score} percentile={cyberScore.percentile} />
              </div>

              {/* X Account Details */}
              {mainXAccount && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">X Account Details</h3>
                  <div className="flex items-center gap-3 mb-4">
                    {mainXAccount.profile_image && (
                      <img
                        src={mainXAccount.profile_image}
                        alt={mainXAccount.display_name}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{mainXAccount.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{mainXAccount.handle}</p>
                    </div>
                  </div>
                  {mainXAccount.description && (
                    <p className="text-sm text-foreground/80 leading-relaxed">{mainXAccount.description}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Contracts Section */}
        {data.contracts && data.contracts.length > 0 && (
          <section id="contracts" className="animate-fade-in-up">
            <SectionTitle id="contracts">Contracts</SectionTitle>
            <div className="space-y-2">
              {data.contracts.map((contract, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border bg-muted/10"
                  style={{ animationDelay: `${0.8 + index * 0.05}s` }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {contract.chain && (
                      <span className="text-xs text-muted-foreground shrink-0">{contract.chain}:</span>
                    )}
                    <span className="text-sm font-mono text-foreground truncate">{contract.address}</span>
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
        {data.exchanges && data.exchanges.length > 0 && (() => {
          const validExchanges = data.exchanges.filter((exchange) => {
            const exchangeName = typeof exchange === 'string' ? exchange : exchange.name;
            return exchangeName && exchangeName.trim() !== '';
          });

          if (validExchanges.length === 0) return null;

          return (
            <section id="exchanges" className="animate-fade-in-up">
              <SectionTitle id="exchanges">Exchanges</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {validExchanges.map((exchange, index) => {
                  const exchangeName = typeof exchange === 'string' ? exchange : exchange.name;
                  const exchangeLogo = typeof exchange === 'object' ? exchange.logo : undefined;

                  return (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                      style={{ animationDelay: `${0.85 + index * 0.01}s` }}
                    >
                      {exchangeLogo && exchangeLogo.trim() !== '' && (
                        <img
                          src={exchangeLogo}
                          alt={exchangeName}
                          className="w-4 h-4 object-contain"
                        />
                      )}
                      <span className="text-sm text-foreground">{exchangeName}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* Similar Projects Section */}
        {data.similar_projects && data.similar_projects.length > 0 && (() => {
          const validProjects = data.similar_projects.filter((project) => {
            const projectName = typeof project === 'string' ? project : project.name;
            return projectName && projectName.trim() !== '';
          });

          if (validProjects.length === 0) return null;

          return (
            <section id="similar" className="animate-fade-in-up">
              <SectionTitle id="similar">Similar Projects</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {validProjects.map((project, index) => {
                  const projectName = typeof project === 'string' ? project : project.name;
                  const projectLogo = typeof project === 'object' ? project.logo : undefined;
                  const projectTags = typeof project === 'object' ? project.tags : undefined;

                  return (
                    <a
                      key={index}
                      href={`/analytics/detail/project?entity=${encodeURIComponent(projectName)}`}
                      className="group p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 hover:border-primary/50 transition-all duration-300"
                      style={{ animationDelay: `${0.9 + index * 0.05}s` }}
                    >
                      <div className="flex items-start gap-3">
                        {projectLogo && projectLogo.trim() !== '' && (
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
                              {projectTags.slice(0, 2).map((tag, tagIndex) => (
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

        {/* About Section */}
        <section id="about" className="animate-fade-in-up">
          <SectionTitle id="about">About {data.name}</SectionTitle>
          {data.description && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-foreground/90 leading-relaxed">{data.description}</p>
            </div>
          )}
        </section>

        {/* Links Section */}
        {data.links && data.links.length > 0 && (
          <section id="links" className="animate-fade-in-up">
            <SectionTitle id="links">Links & Resources</SectionTitle>
            <div className="flex flex-wrap gap-3">
              {data.links.map((link, index) => (
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
                  style={{ animationDelay: `${0.85 + index * 0.05}s` }}
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  {link.type === 'web' ? 'Website' : link.type}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Table of Contents */}
      {showToc && <TableOfContents items={tocItems} />}
    </div>
  );
}
