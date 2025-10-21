"use client";

import { useState } from "react";
import { Message } from "./chat-context";
import { WorkflowStepCard } from "./workflow-step-card";
import { MetadataDisplay } from "./metadata-display";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

interface ReasoningPanelProps {
  message: Message;
  isGenerating?: boolean; // 是否正在生成中
}

export function ReasoningPanel({ message, isGenerating = false }: ReasoningPanelProps) {
  // 自动展开逻辑：正在生成中时展开，否则使用手动状态
  const [manualToggle, setManualToggle] = useState<boolean | null>(null);
  const showReasoning = manualToggle !== null ? manualToggle : isGenerating;

  // 如果没有步骤数据，不显示
  if (!message.steps || message.steps.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      {/* 折叠按钮 */}
      <button
        onClick={() => setManualToggle(!showReasoning)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/50"
      >
        {showReasoning ? (
          <ChevronUpIcon className="w-4 h-4" />
        ) : (
          <ChevronDownIcon className="w-4 h-4" />
        )}
        <span className="font-medium">🧠 推理过程</span>
        <span className="text-xs opacity-70">
          ({message.steps.length} 个步骤)
        </span>
      </button>

      {/* 推理内容 */}
      {showReasoning && (
        <div className="mt-2 space-y-3">
          {/* 工作流步骤列表 */}
          {message.steps.map((step) => (
            <WorkflowStepCard
              key={step.id}
              step={step}
              defaultExpanded={isGenerating} // 生成中时默认展开所有步骤
            />
          ))}

          {/* 元数据显示 */}
          {message.metadata && (
            <MetadataDisplay metadata={message.metadata} />
          )}
        </div>
      )}
    </div>
  );
}
