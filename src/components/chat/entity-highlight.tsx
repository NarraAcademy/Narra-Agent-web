"use client";

import { ReactNode, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EntityCard } from "./entity-card";
import { EntityDetailDialog } from "./entity-detail-dialog";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/types/entity";

interface EntityHighlightProps {
  entity: string;
  type: EntityType;
  children: ReactNode;
}

/**
 * 实体高亮组件 - Hover + Click 版本
 * - Hover：显示快速预览卡片（Popover）
 * - Click：打开详细信息弹窗（Dialog）
 */
export function EntityHighlight({ entity, type, children }: EntityHighlightProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 统一高亮样式 - 使用 primary 颜色
  const highlightClass = cn(
    "text-primary font-medium cursor-pointer",
    "underline decoration-2 underline-offset-2 decoration-primary",
    "transition-colors duration-200"
  );

  // Hover事件处理
  const handleMouseEnter = () => {
    setPopoverOpen(true);
  };

  const handleMouseLeave = () => {
    setPopoverOpen(false);
  };

  // Click事件处理 - 关闭Popover，打开Dialog
  const handleClick = () => {
    setPopoverOpen(false);
    setDialogOpen(true);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <span
            className={highlightClass}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            {children}
          </span>
        </PopoverTrigger>
        <PopoverContent
          className="w-[400px] p-4"
          side="top"
          align="start"
          onOpenAutoFocus={(e) => {
            // 防止自动聚焦时滚动
            e.preventDefault();
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* 快速预览卡片 */}
          <EntityCard entity={entity} type={type} />
        </PopoverContent>
      </Popover>

      {/* 详细信息弹窗 */}
      <EntityDetailDialog
        entity={entity}
        type={type}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
