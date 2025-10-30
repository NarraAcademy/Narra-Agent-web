/**
 * 实体类型定义
 */

export type EntityType = "PROJECT" | "TOKEN" | "ORGANIZATION" | "PERSON" | "TECHNOLOGY" | "CHAIN";

/**
 * NER识别的实体格式
 */
export interface Entity {
  text: string;
  type: EntityType;
  start: number;
  end: number;
}

/**
 * 项目详情数据结构（从 use-project-detail.ts 引入）
 * 这里只定义核心类型，完整类型在 hooks 中
 */
export interface ProjectDetail {
  id: number;
  name: string;
  image: string;
  description: string;
  tags: string[];
  links: ProjectLink[];
  total_funding: number;
  x_accounts: XAccount[];
  tokens?: ProjectToken[];
  events?: ProjectEvent[];
  news?: ProjectNews[];
  team_members?: TeamMember[];
  contracts?: ProjectContract[];
  exchanges?: Exchange[];
  similar_projects?: SimilarProject[];
  coingecko_data?: {
    market_chart?: {
      price?: {
        data: [number, number][];
      };
    };
  };
}

export interface ProjectToken {
  name: string;
  symbol: string;
  logo?: string;
  price?: number;
  market_cap?: number;
  volume_24h?: number;
  holders?: number;
  contract_address?: string;
}

export interface ProjectEvent {
  title: string;
  date?: string;
  description?: string;
}

export interface ProjectNews {
  title: string;
  url: string;
  source?: string;
  publish_time?: string;
}

export interface TeamMember {
  name: string;
  title?: string;
  avatar?: string;
  linkedin?: string;
  twitter?: string;
}

export interface ProjectContract {
  chain: string;
  address: string;
  explorer_url?: string;
}

export interface Exchange {
  name: string;
  logo?: string;
  url?: string;
}

export interface SimilarProject {
  name: string;
  logo?: string;
  tags?: string[];
}

export interface ProjectLink {
  type: string;
  value: string;
}

export interface XAccount {
  id: number;
  profile_image: string;
  handle: string;
  display_name: string;
  description: string;
  followers_count: number;
  cyber_score: CyberScore;
  smart_followers_count: number;
}

export interface CyberScore {
  score: number;
  percentile: number;
}

/**
 * API响应格式
 */
export interface ApiResponse<T> {
  code: 0 | 1;
  message: string;
  data: T;
}

/**
 * 后端项目详情响应
 */
export interface BackendProjectResponse {
  success: boolean;
  message: string | null;
  data: {
    project: ProjectDetail;
  };
}

/**
 * Token图片信息
 */
export interface TokenImage {
  thumb: string;
  small: string;
  large: string;
}

/**
 * Token市场数据
 * 注意：后端返回的所有数值字段都是string类型，需要在使用时转换为number
 */
export interface TokenMarketData {
  current_price: string;
  market_cap: string;
  fully_diluted_valuation: string;
  total_volume: string;
  high_24h: string;
  low_24h: string;
  price_change_percentage_1h: string;
  price_change_percentage_24h: string;
  price_change_percentage_7d: string;
  price_change_percentage_30d: string;
  circulating_supply: string;
  total_supply: string;
  max_supply: string | null;
  ath: string;
  ath_change_percentage: string;
  ath_date: string;
  atl: string;
  atl_change_percentage: string;
  atl_date: string;
}

/**
 * Token开发者数据
 */
export interface TokenDeveloperData {
  forks: number;
  stars: number;
  subscribers: number;
  total_issues: number;
  closed_issues: number;
  pull_requests_merged: number;
  pull_request_contributors: number;
  code_additions_deletions_4_weeks: {
    additions: number;
    deletions: number;
  };
  commit_count_4_weeks: number;
  last_4_weeks_commit_activity_series: number[];
}

/**
 * Token链接信息
 */
export interface TokenLinks {
  homepage: string;
  blockchain_site: string[];
  official_forum_url: string[];
  chat_url: string[];
  announcement_url: string[];
  twitter_screen_name: string;
  facebook_username: string;
  telegram_channel_identifier: string;
  subreddit_url: string;
  repos_url: {
    github: string[];
    bitbucket: string[];
  };
}

/**
 * Token详情数据结构
 */
export interface TokenDetail {
  id: string;
  symbol: string;
  name: string;
  image: TokenImage;
  market_cap_rank: number;
  market_data: TokenMarketData;
  community_data: {
    facebook_likes: number | null;
    reddit_average_posts_48h: number;
    reddit_average_comments_48h: number;
    reddit_subscribers: number;
    reddit_accounts_active_48h: number;
    telegram_channel_user_count: number | null;
  };
  developer_data: TokenDeveloperData;
  links: TokenLinks;
  description: string;
  categories: string[];
  platforms: Record<string, string>;
  market_chart?: {
    price?: any; // 后端直接返回完整的 PriceChartData 格式
    market_cap?: any;
    volume?: any;
  };
}

/**
 * 后端Token详情响应
 */
export interface BackendTokenResponse {
  success: boolean;
  data: TokenDetail;
}

/**
 * 搜索项目列表项
 */
export interface SearchProjectItem {
  id: string;
  name: string;
  logo: string;
  one_liner: string;
  description: string | null;
  tags: string[];
  ecosystem: string[];
  symbol: string | null;
  price: string | null;
  market_cap: string | null;
  active: boolean;
  followers: number;
  heat: number;
  influence: number;
  synced_at: string;
}

/**
 * 搜索项目列表响应
 */
export interface SearchProjectsResponse {
  success: boolean;
  data: {
    projects: SearchProjectItem[];
    page: number;
    page_size: number;
    total: number;
    has_more: boolean;
  };
}

/**
 * 搜索Token列表项
 */
export interface SearchTokenItem {
  symbol: string;
  name: string;
  chain_name: string;
  chain_id: string;
  contract_address: string;
  decimals: number;
  price: string;
  market_cap: string;
  icon_url: string;
  priority: number;
  description: string;
}

/**
 * 搜索Token列表响应
 */
export interface SearchTokensResponse {
  success: boolean;
  total: number;
  tokens: SearchTokenItem[];
}

/**
 * 统一搜索结果项 (用于自动补全)
 */
export interface SearchResultItem {
  type: 'project' | 'token';
  id: string; // project用id, token用symbol
  name: string;
  symbol?: string | null;
  logo: string;
  price: string | null;
  market_cap: string | null;
  priceChange?: string | null; // 涨跌幅
  heat?: number; // 热度
  tags?: string[]; // 标签
}
