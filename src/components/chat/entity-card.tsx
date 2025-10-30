"use client";

import { ProjectCard } from "./project/project-card";
import { TokenCard } from "./token/token-card";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/types/entity";

interface EntityCardProps {
  entity: string;
  type: EntityType;
}

/**
 * 实体类型的中文显示名称
 */
const entityTypeLabels: Record<EntityType, { zh: string; en: string }> = {
  PROJECT: { zh: "项目", en: "Project" },
  TOKEN: { zh: "代币", en: "Token" },
  ORGANIZATION: { zh: "组织", en: "Organization" },
  PERSON: { zh: "人物", en: "Person" },
  TECHNOLOGY: { zh: "技术", en: "Technology" },
  CHAIN: { zh: "区块链", en: "Chain" },
};

/**
 * 空状态卡片组件（用于暂无数据的实体类型）
 */
function EmptyStateCard({ entity, type }: EntityCardProps) {
  const typeLabel = entityTypeLabels[type];

  return (
    <div className="space-y-3 text-sm max-w-[400px]">
      {/* 标题 */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
          <InfoCircledIcon className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base text-foreground truncate">
            {entity}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {typeLabel.zh} / {typeLabel.en}
          </p>
        </div>
      </div>

      {/* 暂无数据提示 */}
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg",
        "bg-muted/30 border border-border"
      )}>
        <InfoCircledIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          暂无详情数据 / No details available yet
        </p>
      </div>

      {/* 占位信息 */}
      <div className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">
        <p>该实体已被识别，但详细信息尚未提供。</p>
        <p className="mt-1">The entity has been identified, but details are not yet available.</p>
      </div>
    </div>
  );
}

/**
 * 统一的实体卡片组件
 * 根据实体类型渲染对应的卡片：
 * - PROJECT/CHAIN: 使用 ProjectCard（有真实数据）
 * - TOKEN: 使用 TokenCard（有真实数据）
 * - 其他类型: 显示空状态卡片
 */
export function EntityCard({ entity, type }: EntityCardProps) {
  // PROJECT 和 CHAIN 类型使用 ProjectCard（后端有数据）
  if (type === "PROJECT" || type === "CHAIN") {
    return <ProjectCard entity={entity} />;
  }

  // TOKEN 类型使用 TokenCard（后端有数据）
  if (type === "TOKEN") {
    return <TokenCard entity={entity} />;
  }

  // 其他类型显示空状态（ORGANIZATION, PERSON, TECHNOLOGY）
  return <EmptyStateCard entity={entity} type={type} />;
}
