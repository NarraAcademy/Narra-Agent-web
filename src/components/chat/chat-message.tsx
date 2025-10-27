"use client";

import { useState, useEffect, useRef } from "react";
import { Message } from "./chat-context";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppContext } from "@/contexts/app";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReasoningPanel } from "./reasoning-panel";
import { TypeWriterMarkdown } from "./typewriter-markdown";
import { LightningBoltIcon, FileTextIcon, DownloadIcon, CopyIcon, Share1Icon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createDebug } from "@/lib/debug";

const debug = createDebug('ChatMessage');

interface ChatMessageProps {
  message: Message;
  isGenerating?: boolean; // 是否正在生成中
}

export function ChatMessage({ message, isGenerating = false }: ChatMessageProps) {
  const { user } = useAppContext();
  const isUser = message.role === "user";

  // 计算 Tab 可见性
  const hasSteps = message.steps && message.steps.length > 0;
  const hasContent = message.content && message.content.trim().length > 0;

  // 调试日志 - 追踪每次渲染
  useEffect(() => {
    if (!isUser) {
      debug.log(`📊 渲染状态 ${message.id.slice(0, 8)}`, {
        isGenerating,
        hasSteps,
        hasContent,
        stepsCount: message.steps?.length || 0,
        contentLength: message.content?.length || 0,
        显示内容: hasSteps && hasContent ? "Tab布局(双Tab)" : hasSteps ? "仅推理" : hasContent ? "仅报告" : "空"
      });
    }
  }, [isUser, message.id, message.steps?.length, message.content?.length, isGenerating, hasSteps, hasContent]);

  // Tab 状态管理
  const [activeTab, setActiveTab] = useState<"reasoning" | "result">(
    // 历史对话默认显示"研究结果"Tab，生成中默认显示"推理过程"Tab
    !isGenerating && hasContent ? "result" : "reasoning"
  );

  // 追踪上次 content 长度，用于检测报告开始生成
  const prevContentLengthRef = useRef(0);

  // 自动切换逻辑：当报告开始生成时，自动切换到"研究结果"Tab
  useEffect(() => {
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

  return (
    <div
      className={cn(
        "py-6 px-4 md:px-6",
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
          {new Date(message.timestamp).toLocaleTimeString("zh-CN", {
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
                    推理过程
                  </TabsTrigger>
                  <TabsTrigger value="result">
                    <FileTextIcon className="mr-2" />
                    研究结果
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
                    className={cn(
                      // 统一字体大小为text-sm
                      "text-sm",
                      // 标题样式 - 深色模式颜色修复
                      "prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground",
                      "prose-h1:text-sm prose-h1:mb-6 prose-h1:mt-8",
                      "prose-h2:text-sm prose-h2:mb-4 prose-h2:mt-6 prose-h2:border-b prose-h2:border-border prose-h2:pb-2",
                      "prose-h3:text-sm prose-h3:mb-3 prose-h3:mt-4",
                      // 段落和文本
                      "prose-p:leading-relaxed prose-p:my-3 prose-p:text-foreground/90",
                      // 移除第一个元素的上边距
                      "[&>:first-child]:mt-0",
                      "prose-strong:text-foreground prose-strong:font-semibold",
                      "prose-em:text-foreground/80",
                      // 链接
                      "prose-a:text-primary prose-a:no-underline prose-a:font-medium",
                      "hover:prose-a:underline hover:prose-a:decoration-2 hover:prose-a:underline-offset-4",
                      // 列表
                      "prose-ul:my-4 prose-ul:leading-relaxed",
                      "prose-ol:my-4 prose-ol:leading-relaxed",
                      "prose-li:my-1 prose-li:text-foreground prose-li:marker:text-primary",
                      // 代码
                      "prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5",
                      "prose-code:rounded-md prose-code:font-mono prose-code:text-sm",
                      "prose-code:before:content-none prose-code:after:content-none",
                      // 代码块
                      "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg",
                      "prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-4",
                      // 表格
                      "prose-table:border-collapse prose-table:border prose-table:border-border prose-table:my-6",
                      "prose-table:w-full prose-table:rounded-lg prose-table:overflow-hidden",
                      "prose-thead:bg-muted/50",
                      "prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-3",
                      "prose-th:text-left prose-th:font-semibold prose-th:text-foreground",
                      "prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-3",
                      "prose-td:text-foreground",
                      "prose-tr:border-b prose-tr:border-border",
                      "prose-tr:transition-colors hover:prose-tr:bg-muted/30",
                      // 引用
                      "prose-blockquote:border-l-4 prose-blockquote:border-l-primary",
                      "prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4",
                      "prose-blockquote:my-4 prose-blockquote:rounded-r-lg",
                      "prose-blockquote:not-italic prose-blockquote:text-foreground/80",
                      // 水平线
                      "prose-hr:border-border prose-hr:my-8",
                      // 图片
                      "prose-img:rounded-lg prose-img:shadow-md"
                    )}
                    components={{
                      // 响应式表格包装
                      table: ({ node, ...props }: any) => (
                        <div className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm">
                          <table {...props} />
                        </div>
                      ),
                      // 自定义渐变背景盒子
                      div: ({ node, style, className, ...props }: any) => {
                        if (style?.background?.includes("gradient")) {
                          return (
                            <div
                              className={cn(
                                "p-5 rounded-xl shadow-lg my-6 text-white",
                                className
                              )}
                              style={style}
                              {...props}
                            />
                          );
                        }
                        return <div className={className} style={style} {...props} />;
                      },
                      // 优化代码块
                      pre: ({ node, ...props }: any) => (
                        <pre
                          className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-4"
                          {...props}
                        />
                      ),
                      // 优化行内代码
                      code: ({ node, inline, ...props }: any) => {
                        if (inline) {
                          return (
                            <code
                              className="bg-muted text-primary px-1.5 py-0.5 rounded-md font-mono text-sm"
                              {...props}
                            />
                          );
                        }
                        return <code {...props} />;
                      },
                    }}
                  />

                  {/* 操作按钮栏 */}
                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
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
                className={cn(
                  // 统一字体大小为text-sm
                  "text-sm",
                  // 标题样式 - 深色模式颜色修复
                  "prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground",
                  "prose-h1:text-sm prose-h1:mb-6 prose-h1:mt-8",
                  "prose-h2:text-sm prose-h2:mb-4 prose-h2:mt-6 prose-h2:border-b prose-h2:border-border prose-h2:pb-2",
                  "prose-h3:text-sm prose-h3:mb-3 prose-h3:mt-4",
                  // 段落和文本
                  "prose-p:leading-relaxed prose-p:my-3 prose-p:text-foreground/90",
                  "[&>:first-child]:mt-0",
                  "prose-strong:text-foreground prose-strong:font-semibold",
                  "prose-em:text-foreground/80",
                  // 链接
                  "prose-a:text-primary prose-a:no-underline prose-a:font-medium",
                  "hover:prose-a:underline hover:prose-a:decoration-2 hover:prose-a:underline-offset-4",
                  // 列表
                  "prose-ul:my-4 prose-ul:leading-relaxed",
                  "prose-ol:my-4 prose-ol:leading-relaxed",
                  "prose-li:my-1 prose-li:text-foreground prose-li:marker:text-primary",
                  // 代码
                  "prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5",
                  "prose-code:rounded-md prose-code:font-mono prose-code:text-sm",
                  "prose-code:before:content-none prose-code:after:content-none",
                  // 代码块
                  "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg",
                  "prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-4",
                  // 表格
                  "prose-table:border-collapse prose-table:border prose-table:border-border prose-table:my-6",
                  "prose-table:w-full prose-table:rounded-lg prose-table:overflow-hidden",
                  "prose-thead:bg-muted/50",
                  "prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-3",
                  "prose-th:text-left prose-th:font-semibold prose-th:text-foreground",
                  "prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-3",
                  "prose-td:text-foreground",
                  "prose-tr:border-b prose-tr:border-border",
                  "prose-tr:transition-colors hover:prose-tr:bg-muted/30",
                  // 引用
                  "prose-blockquote:border-l-4 prose-blockquote:border-l-primary",
                  "prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4",
                  "prose-blockquote:my-4 prose-blockquote:rounded-r-lg",
                  "prose-blockquote:not-italic prose-blockquote:text-foreground/80",
                  // 水平线
                  "prose-hr:border-border prose-hr:my-8",
                  // 图片
                  "prose-img:rounded-lg prose-img:shadow-md"
                )}
                components={{
                  table: ({ node, ...props }: any) => (
                    <div className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm">
                      <table {...props} />
                    </div>
                  ),
                  div: ({ node, style, className, ...props }: any) => {
                    if (style?.background?.includes("gradient")) {
                      return (
                        <div
                          className={cn(
                            "p-5 rounded-xl shadow-lg my-6 text-white",
                            className
                          )}
                          style={style}
                          {...props}
                        />
                      );
                    }
                    return <div className={className} style={style} {...props} />;
                  },
                  pre: ({ node, ...props }: any) => (
                    <pre
                      className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-4"
                      {...props}
                    />
                  ),
                  code: ({ node, inline, ...props }: any) => {
                    if (inline) {
                      return (
                        <code
                          className="bg-muted text-primary px-1.5 py-0.5 rounded-md font-mono text-sm"
                          {...props}
                        />
                      );
                    }
                    return <code {...props} />;
                  },
                }}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
