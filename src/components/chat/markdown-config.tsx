import { cn } from "@/lib/utils";

/**
 * TypeWriterMarkdown 组件的统一配置
 * 提取自 chat-message.tsx，消除重复代码
 */
export const MARKDOWN_CONFIG = {
  className: cn(
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
  ),
  components: {
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
  },
};
