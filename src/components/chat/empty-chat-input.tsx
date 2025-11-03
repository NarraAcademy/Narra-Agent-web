"use client";

import { useState, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

type InputMode = "quick" | "deep" | "agent";

interface EmptyChatInputProps {
  onSend: (message: string, useDeepThinking: boolean) => void;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export function EmptyChatInput({ onSend, disabled, value = "", onChange }: EmptyChatInputProps) {
  const t = useTranslations("chat");
  const [selectedMode, setSelectedMode] = useState<InputMode>("quick");

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    const useDeepThinking = selectedMode === "deep";
    onSend(value.trim(), useDeepThinking);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modes: { key: InputMode; label: string }[] = [
    { key: "quick", label: t("input_mode_quick_ask") },
    { key: "deep", label: t("input_mode_deep_research") },
    { key: "agent", label: t("input_mode_ai_agent") },
  ];

  return (
    <div
      className="relative w-full border border-primary rounded-[25px] md:px-4 md:py-3 px-2 py-2 flex flex-col"
      style={{ backdropFilter: "blur(24px)" }}
    >
      {/* 输入区域：文本框 */}
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("input_placeholder")}
          disabled={disabled}
          className="flex-1 resize-none border-0 !bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground outline-none p-0"
          rows={3}
        />
      </div>

      {/* 底部控制栏：按钮组 + 发送按钮 */}
      <div className="flex items-center justify-between">
        {/* 三个模式按钮 - 分段控制器 */}
        <div className="inline-flex border border-border rounded-lg overflow-hidden bg-muted/10 ">
          {modes.map((mode, index) => {
            const isDisabled = mode.key === "agent";
            return (
              <div
                key={mode.key}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                onClick={() => {
                  if (!isDisabled) {
                    setSelectedMode(mode.key);
                  }
                }}
                onKeyDown={(e) => {
                  if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setSelectedMode(mode.key);
                  }
                }}
                className={cn(
                  "px-2 py-1 text-xs transition-colors whitespace-nowrap",
                  // 添加右边框分隔线，最后一个除外
                  index < modes.length - 1 && "border-r border-border",
                  isDisabled
                    ? "opacity-50 cursor-not-allowed text-muted-foreground"
                    : "cursor-pointer",
                  !isDisabled && selectedMode === mode.key
                    ? "bg-primary text-primary-foreground"
                    : !isDisabled && "text-foreground hover:bg-muted/20"
                )}
              >
                {mode.label}
              </div>
            );
          })}
        </div>

        {/* 发送图标 */}
        <div
          onClick={handleSend}
          className="p-2 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}
