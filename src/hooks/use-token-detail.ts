import useSWR from 'swr';
import type { UnifiedEntityDetail } from '@/types/unified-entity';

// 简单的 fetcher：调用 Next.js API route
const fetcher = async (url: string): Promise<UnifiedEntityDetail> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const json = await response.json();
  if (json.code !== 0) {
    throw new Error(json.message || 'Failed to fetch token detail');
  }

  return json.data;
};

/**
 * SWR Hook for fetching token details
 * @param token - Token name or symbol
 * @param enabled - Whether to enable fetching (default: true)
 */
export function useTokenDetail(token: string | null, enabled = true) {
  const { data, error, isLoading, isValidating } = useSWR<UnifiedEntityDetail>(
    // SWR key: only fetch when token exists and enabled
    token && enabled ? `/api/services/token?token=${encodeURIComponent(token)}` : null,
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
