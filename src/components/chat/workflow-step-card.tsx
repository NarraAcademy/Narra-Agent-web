"use client";

import { useState } from "react";
import { WorkflowStep } from "./chat-context";
import { ReasoningItem } from "./reasoning-item";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

interface WorkflowStepCardProps {
  step: WorkflowStep;
  defaultExpanded?: boolean;
}

// 状态指示器配置
const statusConfig = {
  pending: {
    icon: "⏳",
    label: "等待中",
    color: "text-yellow-600 dark:text-yellow-400",
  },
  running: {
    icon: "⚡",
    label: "运行中",
    color: "text-blue-600 dark:text-blue-400",
  },
  completed: {
    icon: "✅",
    label: "已完成",
    color: "text-green-600 dark:text-green-400",
  },
  error: {
    icon: "❌",
    label: "错误",
    color: "text-red-600 dark:text-red-400",
  },
};

export function WorkflowStepCard({ step, defaultExpanded = true }: WorkflowStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const statusInfo = statusConfig[step.status || "running"];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* 步骤头部 - 可点击折叠 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        {/* 折叠图标 */}
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronDownIcon className="w-5 h-5" />
          ) : (
            <ChevronRightIcon className="w-5 h-5" />
          )}
        </div>

        {/* 状态图标 */}
        {statusInfo && (
          <div className="shrink-0 text-lg">
            {statusInfo.icon}
          </div>
        )}

        {/* 步骤信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base">
              {step.title || `步骤 ${step.id}`}
            </h3>
            {statusInfo && (
              <span className={cn("text-xs font-medium", statusInfo.color)}>
                {statusInfo.label}
              </span>
            )}
            {step.agent && (
              <span className="text-xs text-muted-foreground">
                by {step.agent}
              </span>
            )}
          </div>
          {step.timestamp && (
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(step.timestamp).toLocaleString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          )}
        </div>

        {/* 推理数量统计 */}
        <div className="shrink-0 text-sm text-muted-foreground">
          {step.reasoning.length} 条推理
        </div>
      </button>

      {/* 推理列表 - 折叠内容 */}
      {isExpanded && step.reasoning.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {step.reasoning.map((reasoning) => (
            <ReasoningItem key={reasoning.id} reasoning={reasoning} />
          ))}
        </div>
      )}

      {/* 空状态 */}
      {isExpanded && step.reasoning.length === 0 && (
        <div className="px-4 pb-4 text-sm text-muted-foreground text-center py-6">
          暂无推理记录
        </div>
      )}
    </div>
  );
}
