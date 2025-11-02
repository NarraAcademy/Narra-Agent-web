"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Step as WorkflowStep } from "@/types/chat";
import { ReasoningItem } from "./reasoning-item";
import {
  LightningBoltIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  MixIcon,
  BarChartIcon,
  FileTextIcon,
  ReaderIcon,
  GearIcon,
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

type AgentName =
  | "Coordinator"
  | "CoinGecko"
  | "Project"
  | "News"
  | "Synthesizer"
  | "System";

// 类型守卫：检查是否为有效的 Agent 名称
const isValidAgent = (agent: string | undefined): agent is AgentName => {
  return (
    agent !== undefined &&
    [
      "Coordinator",
      "CoinGecko",
      "Project",
      "News",
      "Synthesizer",
      "System",
    ].includes(agent)
  );
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
  running: {
    icon: LightningBoltIcon,
    label: "运行中",
    color: "",
  },
  completed: {
    icon: CheckCircledIcon,
    label: "已完成",
    color: "",
  },
  failed: {
    icon: CrossCircledIcon,
    label: "失败",
    color: "",
  },
};

const WorkflowStepCardComponent = ({ step }: WorkflowStepCardProps) => {
  console.log(step)
  // 优先级：1. Agent配置 > 2. Status配置
  const iconInfo: IconConfig = isValidAgent(step.agent)
    ? agentConfig[step.agent]
    : statusConfig[step.status || "running"];

  const IconComponent = iconInfo.icon;

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Step header - Always expanded, not collapsible */}
      <div className="w-full flex items-center gap-3 p-3">
        {/* Agent/Status icon with background */}
        <IconComponent className={cn("w-4 h-4")} />
        {/* Step information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">
              {step.title || `Step ${step.id}`}
            </h3>
            {step.agent && (
              <span
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  "bg-muted/50 text-muted-foreground font-medium"
                )}
              >
                {step.agent}
              </span>
            )}
          </div>
        </div>

        {/* Reasoning count badge */}
        <div className="shrink-0 px-2 py-1 rounded-md bg-muted/30 text-xs font-medium text-muted-foreground">
          {step.items.length} {step.items.length === 1 ? "item" : "items"}
        </div>
      </div>

      <div>
        {/* Reasoning list - Sequential fade-in animation */}
        {step.items.length > 0 && (
          <motion.div
            className="px-3 pb-3 space-y-1.5"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.07,
                  delayChildren: 0.05,
                },
              },
            }}
          >
            {step.items.map((reasoning) => (
              <motion.div
                key={reasoning.id}
                variants={{
                  hidden: { opacity: 0, y: -8 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.38,
                      ease: [0.25, 0.1, 0.25, 1],
                    },
                  },
                }}
              >
                <ReasoningItem reasoning={reasoning} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {step.items.length === 0 && (
          <div className="px-3 pb-3 text-xs text-muted-foreground">
            No reasoning records
          </div>
        )}
      </div>
    </div>
  );
};

// Use React.memo to optimize performance and prevent unnecessary re-renders
export const WorkflowStepCard = React.memo(WorkflowStepCardComponent);
