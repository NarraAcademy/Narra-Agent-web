"use client";

import { Message } from "./chat-context";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppContext } from "@/contexts/app";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAppContext();
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "py-6 px-4 md:px-6",
        isUser ? "flex items-start gap-3 bg-background" : "bg-muted/30"
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

        <div
          className={cn(
            "prose prose-slate dark:prose-invert max-w-none",
            // 标题样式
            "prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:tracking-tight",
            "prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8",
            "prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6 prose-h2:border-b prose-h2:border-border prose-h2:pb-2",
            "prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-4",
            // 段落和文本
            "prose-p:leading-relaxed prose-p:my-3 prose-p:text-foreground/90",
            // 移除第一个元素的上边距，确保与头像对齐
            "[&>:first-child]:mt-0",
            "prose-strong:text-foreground prose-strong:font-semibold",
            "prose-em:text-foreground/80",
            // 链接
            "prose-a:text-primary prose-a:no-underline prose-a:font-medium",
            "hover:prose-a:underline hover:prose-a:decoration-2 hover:prose-a:underline-offset-4",
            // 列表
            "prose-ul:my-4 prose-ul:leading-relaxed",
            "prose-ol:my-4 prose-ol:leading-relaxed",
            "prose-li:my-1 prose-li:marker:text-primary",
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
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            components={{
              // 响应式表格包装
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm">
                  <table {...props} />
                </div>
              ),
              // 自定义渐变背景盒子(后端返回的样式)
              div: ({ node, style, className, ...props }: any) => {
                // 检测是否是渐变背景的div
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
              pre: ({ node, ...props }) => (
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
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
