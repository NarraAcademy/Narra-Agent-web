import useSWR from 'swr';

// 项目链接
export interface ProjectLink {
  type: string;
  value: string;
}

// 新闻
export interface ProjectNews {
  id: string;
  title: string;
  url: string;
  publish_at: number;
  source: string;
  summary: string;
}

// 事件/里程碑
export interface ProjectEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
  url: string;
}

// X账号信息
export interface XAccount {
  id: number;
  profile_image: string;
  handle: string;
  display_name: string;
  description: string;
  followers_count: number;
  cyber_score: {
    score: number;
    percentile: number;
  };
  smart_followers_count: number;
}

// 团队成员
export interface TeamMember {
  id: string;
  name: string;
  jobs: string[];
  image: string;
  links: ProjectLink[];
  priority: number;
  person_id: string;
}

// 区块链
export interface Chain {
  id: string;
  name: string;
  image: string;
  tvl: string | null;
  ecosystems: any[];
  ecosystem_count: number;
}

// 完整的项目详情
export interface ProjectDetail {
  id: number;
  name: string;
  image: string;
  description: string;
  tags: string[];
  links: ProjectLink[];
  active: boolean;
  establishment_date: string;
  token_launch_time: string;
  news: ProjectNews[];
  events: ProjectEvent[];
  has_cyber_mind_share: boolean;
  trending_reason_insight: string | null;
  x_accounts: XAccount[];
  heat_rank: number | null;
  influence_rank: number | null;
  tokens: any[];
  chains: Chain[];
  team_members: TeamMember[];
  fundings_v2: any | null;
  total_funding: number;
  contracts: any[];
  exchanges: any[];
  similar_projects: any[];
  campaigns: any[];
  top_tweets: any[];
  coingecko_data: any | null;
}

interface APIResponse {
  code: 0 | 1;
  message: string;
  data?: {
    success: boolean;
    message: string | null;
    data: {
      project: ProjectDetail;
    };
  };
}

const fetcher = async (url: string): Promise<ProjectDetail> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const json: APIResponse = await response.json();

  if (json.code !== 0 || !json.data?.data?.project) {
    throw new Error(json.message || 'Failed to fetch project detail');
  }

  return json.data.data.project;
};

/**
 * SWR Hook for fetching project details
 * @param entity - Project entity name
 * @param enabled - Whether to enable fetching (default: true)
 */
export function useProjectDetail(entity: string | null, enabled = true) {
  const { data, error, isLoading, isValidating } = useSWR<ProjectDetail>(
    // SWR key: only fetch when entity exists and enabled
    entity && enabled ? `/api/project?entity=${encodeURIComponent(entity)}` : null,
    fetcher,
    {
      // SWR 配置
      revalidateOnFocus: false, // 不在窗口聚焦时重新验证
      revalidateOnReconnect: false, // 不在重新连接时重新验证
      dedupingInterval: 60000, // 60秒内去重
      shouldRetryOnError: true, // 错误时重试
      errorRetryCount: 2, // 最多重试2次
    }
  );

  return {
    data,
    isLoading, // 首次加载
    isValidating, // 重新验证中
    error,
  };
}
