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
}

/**
 * 后端Token详情响应
 */
export interface BackendTokenResponse {
  success: boolean;
  data: TokenDetail;
}
