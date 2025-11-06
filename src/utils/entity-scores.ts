/**
 * 实体评分计算工具
 * 基于现有数据计算 Token 和 Project 的雷达图评分
 */

import type { UnifiedEntityDetail } from '@/types/unified-entity';

export interface RadarDimension {
  name: string;
  value: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface RadarScores {
  dimensions: RadarDimension[];
}

/**
 * 分数转等级
 */
function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * 计算 Token 市场健康度评分 (5维度)
 */
export function calculateTokenScores(entity: UnifiedEntityDetail): RadarScores {
  if (entity.type !== 'TOKEN' || !entity.tokenData) {
    return { dimensions: [] };
  }

  const { marketData, communityData, developerData } = entity.tokenData;

  // 1. 市场表现 (基于市值排名)
  const marketPerformance = Math.max(0, 100 - (entity.tokenData.marketCapRank || 100));

  // 2. 流动性 (交易量/市值比率)
  const volumeToMarketCapRatio = marketData.totalVolume / (marketData.marketCap || 1);
  const liquidity = Math.min(100, volumeToMarketCapRatio * 100 * 2);

  // 3. 社区活跃度 (基于社区人数对数)
  const totalCommunity =
    (communityData?.telegramChannelUserCount || 0) +
    (communityData?.redditSubscribers || 0);
  const community =
    totalCommunity > 0
      ? Math.min(100, (Math.log10(totalCommunity + 1) / Math.log10(100000)) * 100)
      : 0;

  // 4. 开发活跃度 (GitHub数据)
  const stars = developerData?.stars || 0;
  const commits = developerData?.commitCount4Weeks || 0;
  const development = Math.min(100, stars / 10 + commits * 2);

  // 5. 价格稳定性 (波动越小越好)
  const volatility = Math.abs(marketData.priceChangePercentage24h || 0);
  const stability = Math.max(0, 100 - volatility * 5);

  return {
    dimensions: [
      {
        name: 'Market Performance',
        value: Math.round(marketPerformance),
        grade: getGrade(marketPerformance),
      },
      {
        name: 'Liquidity',
        value: Math.round(liquidity),
        grade: getGrade(liquidity),
      },
      {
        name: 'Community',
        value: Math.round(community),
        grade: getGrade(community),
      },
      {
        name: 'Development',
        value: Math.round(development),
        grade: getGrade(development),
      },
      {
        name: 'Stability',
        value: Math.round(stability),
        grade: getGrade(stability),
      },
    ],
  };
}

/**
 * 计算 Project 综合实力评分 (5维度)
 */
export function calculateProjectScores(entity: UnifiedEntityDetail): RadarScores {
  if (entity.type !== 'PROJECT' || !entity.projectData) {
    return { dimensions: [] };
  }

  const { projectData } = entity;

  // 1. 融资能力 (对数分数)
  const funding = projectData.totalFunding || 0;
  const fundraising =
    funding > 0 ? Math.min(100, (Math.log10(funding) / Math.log10(100000000)) * 100) : 0;

  // 2. 团队规模
  const teamCount = projectData.teamMembers?.length || 0;
  const team = Math.min(100, teamCount * 2);

  // 3. 市场影响力 (交易所数量)
  const exchangeCount = projectData.exchanges?.length || 0;
  const marketImpact = Math.min(100, exchangeCount * 3.3);

  // 4. 社区关注 (新闻 + 社交媒体)
  const newsCount = projectData.news?.length || 0;
  const xFollowers = projectData.xAccounts?.[0]?.followersCount || 0;
  const socialTraction = Math.min(100, newsCount * 10 + xFollowers / 10000);

  // 5. 发展里程碑 (事件数量)
  const eventCount = projectData.events?.length || 0;
  const milestones = Math.min(100, eventCount * 5);

  return {
    dimensions: [
      {
        name: 'Fundraising',
        value: Math.round(fundraising),
        grade: getGrade(fundraising),
      },
      {
        name: 'Team',
        value: Math.round(team),
        grade: getGrade(team),
      },
      {
        name: 'Market Impact',
        value: Math.round(marketImpact),
        grade: getGrade(marketImpact),
      },
      {
        name: 'Social Traction',
        value: Math.round(socialTraction),
        grade: getGrade(socialTraction),
      },
      {
        name: 'Milestones',
        value: Math.round(milestones),
        grade: getGrade(milestones),
      },
    ],
  };
}

/**
 * 根据实体类型自动计算评分
 */
export function calculateEntityScores(entity: UnifiedEntityDetail): RadarScores {
  if (entity.type === 'TOKEN') {
    return calculateTokenScores(entity);
  }
  return calculateProjectScores(entity);
}
