"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpIcon } from "@radix-ui/react-icons";

interface ChatInputProps {
  onSend: (message: string, useDeepThinking: boolean) => void;
  disabled?: boolean;
  variant?: "centered" | "floating";
  value?: string; // 受控模式：外部传入的值
  onChange?: (value: string) => void; // 受控模式：值变化回调
}

export function ChatInput({ onSend, disabled, variant = "centered", value: externalValue, onChange: externalOnChange }: ChatInputProps) {
  const t = useTranslations("chat");
  const [internalMessage, setInternalMessage] = useState("");
  const [useDeepThinking] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 使用受控模式或非受控模式
  const isControlled = externalValue !== undefined;
  const message = isControlled ? externalValue : internalMessage;
  const setMessage = isControlled ? (externalOnChange || (() => {})) : setInternalMessage;

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    onSend(message.trim(), useDeepThinking);
    setMessage("");

    // 重置textarea高度
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 共用的输入框组件
  const inputContent = (
    <div className="flex gap-2 items-center">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("input_placeholder")}
        disabled={disabled}
        className="h-[44px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
        rows={2}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="icon"
        className="shrink-0 h-[30px] w-[30px] rounded-full"
      >
        <ArrowUpIcon className="w-4 h-4" />
      </Button>
    </div>
  );

  // 浮窗样式：相对于消息区域居中（跟消息同宽）
  if (variant === "floating") {
    return (
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[calc(100%-4rem)] md:max-w-[800px] z-50 px-4">
        <div className="bg-background rounded-3xl shadow-lg border border-border p-2">
          {inputContent}
        </div>
      </div>
    );
  }

  // 居中样式（默认）：空对话状态
  return (
    <div className="bg-background p-4">
      <div className="bg-background rounded-3xl border border-border p-2">
        {inputContent}
      </div>
    </div>
  );
}
