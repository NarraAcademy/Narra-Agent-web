"use client";

import React from "react";
import { motion } from "framer-motion";
import { WorkflowStep, AgentName } from "./chat-context";
import { ReasoningItem } from "./reasoning-item";
import {
  ClockIcon,
  LightningBoltIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  MixIcon,
  BarChartIcon,
  FileTextIcon,
  ReaderIcon,
  GearIcon
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

interface WorkflowStepCardProps {
  step: WorkflowStep;
}

// 图标配置类型
type IconConfig = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
};

// 类型守卫：检查是否为有效的 Agent 名称
const isValidAgent = (agent: string | undefined): agent is AgentName => {
  return agent !== undefined &&
    ["Coordinator", "CoinGecko", "Project", "News", "Synthesizer", "System"].includes(agent);
};

// Agent图标配置（优先级最高）
const agentConfig: Record<AgentName, IconConfig> = {
  Coordinator: {
    icon: MixIcon,
    label: "协调器",
    color: "text-indigo-600 dark:text-indigo-400",
  },
  CoinGecko: {
    icon: BarChartIcon,
    label: "市场数据",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  Project: {
    icon: FileTextIcon,
    label: "项目信息",
    color: "text-cyan-600 dark:text-cyan-400",
  },
  News: {
    icon: ReaderIcon,
    label: "新闻",
    color: "text-amber-600 dark:text-amber-400",
  },
  Synthesizer: {
    icon: LightningBoltIcon,
    label: "综合分析",
    color: "text-violet-600 dark:text-violet-400",
  },
  System: {
    icon: GearIcon,
    label: "系统",
    color: "text-gray-600 dark:text-gray-400",
  },
};

// 状态指示器配置（作为fallback）
const statusConfig: Record<NonNullable<WorkflowStep["status"]>, IconConfig> = {
  pending: {
    icon: ClockIcon,
    label: "等待中",
    color: "text-yellow-600 dark:text-yellow-400",
  },
  running: {
    icon: LightningBoltIcon,
    label: "运行中",
    color: "text-blue-600 dark:text-blue-400",
  },
  completed: {
    icon: CheckCircledIcon,
    label: "已完成",
    color: "text-green-600 dark:text-green-400",
  },
  error: {
    icon: CrossCircledIcon,
    label: "错误",
    color: "text-red-600 dark:text-red-400",
  },
};

const WorkflowStepCardComponent = ({ step }: WorkflowStepCardProps) => {
  // 优先级：1. Agent配置 > 2. Status配置
  const iconInfo: IconConfig = isValidAgent(step.agent)
    ? agentConfig[step.agent]
    : statusConfig[step.status || "running"];

  const IconComponent = iconInfo.icon;

  return (
    <div className="border-l-2 border-muted pl-3">
      {/* Step header - Always expanded, not collapsible */}
      <div className="w-full flex items-center gap-2 py-1.5">
        {/* Agent/Status icon - Using cn() for className concatenation */}
        <IconComponent className={cn("w-4 h-4", iconInfo.color)} />

        {/* Step information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm">
              {step.title || `Step ${step.id}`}
            </h3>
            {step.agent && (
              <span className="text-xs text-muted-foreground">
                {step.agent}
              </span>
            )}
          </div>
        </div>

        {/* Reasoning count */}
        <div className="shrink-0 text-xs text-muted-foreground">
          {step.reasoning.length} items
        </div>
      </div>

      {/* Reasoning list - Sequential fade-in animation */}
      {step.reasoning.length > 0 && (
        <motion.div
          className="mt-1 ml-6 space-y-1"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.07,
                delayChildren: 0.05
              }
            }
          }}
        >
          {step.reasoning.map((reasoning) => (
            <motion.div
              key={reasoning.id}
              variants={{
                hidden: { opacity: 0, y: -8 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.38,
                    ease: [0.25, 0.1, 0.25, 1]
                  }
                }
              }}
            >
              <ReasoningItem reasoning={reasoning} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {step.reasoning.length === 0 && (
        <div className="ml-6 text-xs text-muted-foreground py-2">
          No reasoning records
        </div>
      )}
    </div>
  );
};

// Use React.memo to optimize performance and prevent unnecessary re-renders
export const WorkflowStepCard = React.memo(WorkflowStepCardComponent);
