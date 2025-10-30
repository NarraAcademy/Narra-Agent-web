import useSWR from 'swr';
import type { ProjectDetail } from '@/types/entity';

// 简单的 fetcher：调用 Next.js API route
const fetcher = async (url: string): Promise<ProjectDetail> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const json = await response.json();
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
    entity && enabled ? `/api/services/project?entity=${encodeURIComponent(entity)}` : null,
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
