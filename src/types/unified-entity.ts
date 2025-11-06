/**
 * 统一的实体详情响应类型
 * 整合 Project 和 Token 的数据结构
 */

import type {
  ProjectToken,
  ProjectEvent,
  ProjectNews,
  TeamMember,
  ProjectContract,
  Exchange,
  SimilarProject,
  ProjectLink
} from './entity';

/**
 * X账号信息（camelCase 版本）
 */
export interface UnifiedXAccount {
  id: number;
  profileImage: string;
  handle: string;
  displayName: string;
  description: string;
  followersCount: number;
  smartFollowersCount: number;
  cyberScore: {
    score: number;
    percentile: number;
  };
}

/**
 * Token图片信息
 */
export interface UnifiedTokenImage {
  thumb: string;
  small: string;
  large: string;
}

/**
 * Token市场数据（所有字段统一为 number）
 */
export interface UnifiedTokenMarketData {
  currentPrice: number;
  marketCap: number;
  fullyDilutedValuation: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  priceChangePercentage1h: number;
  priceChangePercentage24h: number;
  priceChangePercentage7d: number;
  priceChangePercentage30d: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  ath: number;
  athChangePercentage: number;
  athDate: string;
  atl: number;
  atlChangePercentage: number;
  atlDate: string;
}

/**
 * Token社区数据
 */
export interface UnifiedTokenCommunityData {
  facebookLikes: number | null;
  redditAveragePosts48h: number;
  redditAverageComments48h: number;
  redditSubscribers: number;
  redditAccountsActive48h: number;
  telegramChannelUserCount: number | null;
}

/**
 * Token开发者数据
 */
export interface UnifiedTokenDeveloperData {
  forks: number;
  stars: number;
  subscribers: number;
  totalIssues: number;
  closedIssues: number;
  pullRequestsMerged: number;
  pullRequestContributors: number;
  codeAdditionsDeletions4Weeks: {
    additions: number | null;
    deletions: number | null;
  };
  commitCount4Weeks: number;
  last4WeeksCommitActivitySeries: number[];
}

/**
 * Token链接信息
 */
export interface UnifiedTokenLinks {
  homepage: string;
  blockchainSite: string[];
  officialForumUrl: string[];
  chatUrl: string[];
  announcementUrl: string[];
  twitterScreenName: string;
  facebookUsername: string;
  telegramChannelIdentifier: string;
  subredditUrl: string | null;
  reposUrl: {
    github: string[];
    bitbucket: string[];
  };
}

/**
 * 价格数据点
 */
export interface PriceDataPoint {
  timestamp: number;
  datetime: string;
  price: number;
}

/**
 * 价格图表数据
 */
export interface PriceChartData {
  coin_id?: string;
  time_range?: any;
  price?: {
    current?: number;
    start?: number;
    change?: number;
    change_percentage?: number;
    high?: number;
    low?: number;
    data?: PriceDataPoint[];
  };
  market_cap?: any;
  volume?: any;
}

/**
 * Key Metric 数据项
 */
export interface KeyMetric {
  label: string;
  value: string;
}

/**
 * Project 特有数据
 */
export interface ProjectSpecificData {
  totalFunding: number;
  tags: string[];
  xAccounts: UnifiedXAccount[];
  tokens?: ProjectToken[];
  events: ProjectEvent[]; // 始终返回数组,没数据就是空数组
  news: ProjectNews[]; // 始终返回数组,没数据就是空数组
  teamMembers: TeamMember[]; // 始终返回数组,没数据就是空数组
  contracts: ProjectContract[]; // 始终返回数组,没数据就是空数组
  exchanges: Exchange[]; // 始终返回数组,没数据就是空数组
  similarProjects: SimilarProject[]; // 始终返回数组,没数据就是空数组
  links: ProjectLink[]; // 始终返回数组,没数据就是空数组
  priceChart?: PriceChartData;
  keyMetrics: KeyMetric[]; // 始终返回数组,没数据就是空数组
}

/**
 * Token 特有数据
 */
export interface TokenSpecificData {
  marketCapRank: number;
  marketData: UnifiedTokenMarketData;
  communityData?: UnifiedTokenCommunityData;
  developerData?: UnifiedTokenDeveloperData;
  links?: UnifiedTokenLinks;
  categories?: string[];
  platforms?: Record<string, string>;
  priceChart?: PriceChartData;
}

/**
 * 统一的实体详情响应
 */
export interface UnifiedEntityDetail {
  type: 'PROJECT' | 'TOKEN';
  id: string;
  name: string;
  symbol?: string;
  image: string | UnifiedTokenImage;
  description: string;

  // Project 特有字段（当 type === 'PROJECT' 时存在）
  projectData?: ProjectSpecificData;

  // Token 特有字段（当 type === 'TOKEN' 时存在）
  tokenData?: TokenSpecificData;
}

/**
 * API响应包装
 */
export interface UnifiedEntityResponse {
  success: boolean;
  message?: string | null;
  data: UnifiedEntityDetail;
}
