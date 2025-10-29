"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityDetailContent } from "./entity-detail-content";
import type { EntityType } from "@/types/entity";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

interface EntityDetailDialogProps {
  entity: string;
  type: EntityType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 实体详情 Dialog 组件
 * - 在移动端全屏显示
 * - 提供"在新页面打开"链接
 * - 内容区域可滚动
 */
export function EntityDetailDialog({ entity, type, open, onOpenChange }: EntityDetailDialogProps) {
  const params = useParams();
  const locale = params?.locale || 'en';

  // 构建详情页面 URL
  const detailUrl = type === "TOKEN"
    ? `/${locale}/detail/token?token=${encodeURIComponent(entity)}`
    : `/${locale}/detail/project?entity=${encodeURIComponent(entity)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {type === "TOKEN" ? "Token Details" : "Project Details"}
            </DialogTitle>
            <a
              href={detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md",
                "text-xs font-medium",
                "text-primary hover:bg-primary/10",
                "transition-colors"
              )}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <ExternalLinkIcon className="w-3 h-3" />
              Open in new page
            </a>
          </div>
        </DialogHeader>

        <EntityDetailContent entity={entity} type={type} />
      </DialogContent>
    </Dialog>
  );
}
