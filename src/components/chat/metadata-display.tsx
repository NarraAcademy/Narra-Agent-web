"use client";

import { Message } from "./chat-context";

interface MetadataDisplayProps {
  metadata: Message["metadata"];
}

export function MetadataDisplay({ metadata }: MetadataDisplayProps) {
  if (!metadata) return null;

  const { tools_used, agents_used } = metadata;

  // 统一处理 agents_used 为数组
  const agentsArray = agents_used
    ? Array.isArray(agents_used)
      ? agents_used
      : [agents_used]
    : [];

  // 如果没有任何数据，不显示
  if (!tools_used?.length && !agentsArray.length) {
    return null;
  }

  return (
    <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border space-y-3">
      <div className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="text-lg">📊</span>
        执行摘要
      </div>

      {/* 使用的工具 */}
      {tools_used && tools_used.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            使用的工具 ({tools_used.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {tools_used.map((tool, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-500/20"
              >
                <span className="text-sm">🔧</span>
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 使用的Agents */}
      {agentsArray.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            使用的Agents ({agentsArray.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {agentsArray.map((agent, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium border border-purple-500/20"
              >
                <span className="text-sm">🤖</span>
                {agent}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
