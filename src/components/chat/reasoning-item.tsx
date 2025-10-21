"use client";

import { ReasoningStep } from "./chat-context";
import { cn } from "@/lib/utils";

interface ReasoningItemProps {
  reasoning: ReasoningStep;
}

// category图标和样式配置
const categoryConfig = {
  search: {
    icon: "🔍",
    label: "搜索",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  browse: {
    icon: "🌐",
    label: "浏览",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    textColor: "text-green-600 dark:text-green-400",
  },
  analyze: {
    icon: "🧠",
    label: "分析",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  tool_call: {
    icon: "🔧",
    label: "工具",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    textColor: "text-orange-600 dark:text-orange-400",
  },
  status: {
    icon: "📊",
    label: "状态",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    textColor: "text-gray-600 dark:text-gray-400",
  },
  info: {
    icon: "ℹ️",
    label: "信息",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    textColor: "text-slate-600 dark:text-slate-400",
  },
};

export function ReasoningItem({ reasoning }: ReasoningItemProps) {
  const config = categoryConfig[reasoning.category] || categoryConfig.info;

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg border transition-all",
        config.bgColor,
        config.borderColor
      )}
    >
      {/* 图标 */}
      <div className="shrink-0 text-xl leading-none pt-0.5">
        {config.icon}
      </div>

      {/* 内容区 */}
      <div className="flex-1 space-y-2">
        {/* 头部：Agent名称和分类标签 */}
        <div className="flex items-center gap-2 text-sm">
          <span className={cn("font-semibold", config.textColor)}>
            {reasoning.agent}
          </span>
          <span className={cn("text-xs px-2 py-0.5 rounded", config.bgColor, config.textColor)}>
            {config.label}
          </span>
          {reasoning.timestamp && (
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(reasoning.timestamp).toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* 推理内容 */}
        {reasoning.content && (
          <div className="text-sm text-foreground/90 leading-relaxed">
            {reasoning.content}
          </div>
        )}

        {/* 元数据 */}
        {reasoning.metadata && Object.keys(reasoning.metadata).length > 0 && (
          <div className="text-xs space-y-1">
            {reasoning.metadata.url && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">URL:</span>
                <a
                  href={reasoning.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {reasoning.metadata.url}
                </a>
              </div>
            )}
            {reasoning.metadata.duration !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">耗时:</span>
                <span className={config.textColor}>
                  {reasoning.metadata.duration.toFixed(2)}s
                </span>
              </div>
            )}
            {/* 其他元数据 */}
            {Object.entries(reasoning.metadata)
              .filter(([key]) => key !== "url" && key !== "duration")
              .map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="text-foreground/80">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
