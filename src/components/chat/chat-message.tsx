"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@/types/chat";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppContext } from "@/contexts/app";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReasoningPanel } from "./reasoning-panel";
import { TypeWriterMarkdown } from "./typewriter-markdown";
import { MARKDOWN_CONFIG } from "./markdown-config";
import { LightningBoltIcon, FileTextIcon, DownloadIcon, CopyIcon, Share1Icon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createDebug } from "@/lib/debug";
import type { Entity } from "@/types/entity";
import { useTranslations } from "next-intl";

const debug = createDebug('ChatMessage');

interface ChatMessageProps {
  message: Message;
  isGenerating?: boolean; // 是否正在生成中
}

/**
 * 调用 NER API 识别文本实体
 * 导出供 Store 或 Engine 层使用
 */
export async function fetchEntities(content: string): Promise<Entity[]> {
  try {
    const response = await fetch('/api/services/ner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }), // 后端接收参数是 text
    });

    if (!response.ok) {
      throw new Error(`NER API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.code === 0 && result.data?.entities) {
      debug.log('✅ NER识别成功', {
        entitiesCount: result.data.entities.length,
        entities: result.data.entities
      });
      return result.data.entities;
    }

    return [];
  } catch (error) {
    debug.error('❌ NER识别失败', error);
    return [];
  }
}

export function ChatMessage({ message, isGenerating = false }: ChatMessageProps) {
  const t = useTranslations("chat");
  const { user } = useAppContext();
  const isUser = message.role === "user";

  // 计算 Tab 可见性
  const hasSteps = message.steps && message.steps.length > 0;
  const hasContent = message.content && message.content.trim().length > 0;

  // NER 实体从 message 中读取
  const entities = message.entities || [];

  // 调试日志 - 追踪每次渲染
  useEffect(() => {
    if (!isUser) {
      debug.log(`📊 渲染状态 ${message.id.slice(0, 8)}`, {
        isGenerating,
        hasSteps,
        hasContent,
        stepsCount: message.steps?.length || 0,
        contentLength: message.content?.length || 0,
        entitiesCount: entities.length,
        显示内容: hasSteps && hasContent ? "Tab布局(双Tab)" : hasSteps ? "仅推理" : hasContent ? "仅报告" : "空"
      });
    }
  }, [isUser, message.id, message.steps?.length, message.content?.length, entities.length, isGenerating, hasSteps, hasContent]);

  // Tab 状态管理
  const [activeTab, setActiveTab] = useState<"reasoning" | "result">(
    // 历史对话默认显示"研究结果"Tab，生成中默认显示"推理过程"Tab
    !isGenerating && hasContent ? "result" : "reasoning"
  );

  // 追踪上次 content 长度，用于检测报告开始生成
  const prevContentLengthRef = useRef(0);

  // 自动切换逻辑：当报告开始生成时，自动切换到"研究结果"Tab
  useEffect(() => {
    console.log(message)
    if (!isUser && isGenerating) {
      const currentLength = message.content?.length || 0;
      const prevLength = prevContentLengthRef.current;

      // 检测到 content 从空或很短变为有内容（报告开始生成）
      if (currentLength > 0 && prevLength === 0) {
        debug.log('🔄 检测到B流开始,自动切换到研究结果Tab', {
          messageId: message.id,
          contentLength: currentLength,
          stepsCount: message.steps?.length || 0
        });
        setActiveTab("result");
      }

      prevContentLengthRef.current = currentLength;
    }
  }, [message.content, isGenerating, isUser, message.id, message.steps?.length]);

  // NER 实体直接从 message 中读取，不再在组件中调用 API
  // fetchEntities 应该在消息生成完成后，由 Store 或 Engine 层调用并保存到 Message

  return (
    <div
      className={cn(
        "py-4",
        isUser ? "flex gap-3 bg-background items-center" : "bg-muted/30"
      )}
    >
      {/* 用户消息显示头像 */}
      {isUser && <UserAvatar user={user} role="user" />}

      <div className={cn(
        "overflow-hidden group relative",
        isUser ? "flex-1" : "w-full"
      )}>
        {/* hover 时显示时间 */}
        <span className="absolute right-2 top-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {new Date(message.createdAt).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {isUser ? (
          <div className="prose prose-slate dark:prose-invert max-w-none [&>:first-child]:mt-0 text-foreground">
            <Streamdown>
              {message.content}
            </Streamdown>
          </div>
        ) : (
          <>
            {/* Assistant 消息：使用 Tabs 布局 */}
            {hasSteps && hasContent ? (
              // 两个 Tab 都可见：显示完整的 Tabs 组件
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "reasoning" | "result")} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="reasoning">
                    <LightningBoltIcon className="mr-2" />
                    {t("tab_thinking")}
                  </TabsTrigger>
                  <TabsTrigger value="result">
                    <FileTextIcon className="mr-2" />
                    {t("tab_research")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="reasoning" className="mt-0">
                  <ReasoningPanel message={message} isGenerating={isGenerating} hideToggleButton />
                </TabsContent>

                <TabsContent value="result" className="mt-0">
                  <TypeWriterMarkdown
                    content={message.content}
                    isGenerating={isGenerating}
                    speed={15}
                    entities={entities}
                    {...MARKDOWN_CONFIG}
                  />

                  {/* 操作按钮栏 */}
                  <div className="flex justify-start gap-3 mt-4 pt-4 border-t border-border">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DownloadIcon className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>下载PDF</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CopyIcon className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>复制内容</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Share1Icon className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>分享</TooltipContent>
                    </Tooltip>
                  </div>
                </TabsContent>
              </Tabs>
            ) : hasSteps ? (
              // 只有推理过程：直接显示，不显示 Tab 切换
              <ReasoningPanel message={message} isGenerating={isGenerating} hideToggleButton />
            ) : hasContent ? (
              // 只有研究结果：直接显示，不显示 Tab 切换
              <TypeWriterMarkdown
                content={message.content}
                isGenerating={isGenerating}
                speed={15}
                entities={entities}
                {...MARKDOWN_CONFIG}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
