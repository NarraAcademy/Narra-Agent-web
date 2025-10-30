"use client";

import type { EntityType } from "@/types/entity";
import { TokenDetailContent } from "./token/token-detail";
import { ProjectDetailContent } from "./project/project-detail";

interface EntityDetailContentProps {
  entity: string;
  type: EntityType;
  showToc: boolean; // 是否显示目录：全页面模式传true，弹窗模式传false
}

/**
 * 实体详情内容组件 - 路由器
 */
export function EntityDetailContent({ entity, type, showToc }: EntityDetailContentProps) {
  if (type === "PROJECT" || type === "CHAIN") {
    return <ProjectDetailContent entity={entity} showToc={showToc} />;
  }

  if (type === "TOKEN") {
    return <TokenDetailContent entity={entity} showToc={showToc} />;
  }

  return (
    <div className="text-sm text-muted-foreground text-center py-16">
      Unsupported entity type: {type}
    </div>
  );
}
