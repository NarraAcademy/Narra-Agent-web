"use client";

import { useEffect, useState, useRef, ReactNode, useMemo } from "react";
import { Streamdown } from "streamdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { createDebug } from "@/lib/debug";
import { EntityHighlight } from "./entity-highlight";

const debug = createDebug('TypeWriterMarkdown');

type EntityCategory = "PROJECT" | "TOKEN" | "ORGANIZATION" | "PERSON" | "TECHNOLOGY" | "CHAIN";

// 匹配后端NER接口返回的数据格式
export interface Entity {
  text: string;        // 实体文本
  type: EntityCategory; // 实体类型
  start: number;       // 起始位置
  end: number;         // 结束位置
}

interface TypeWriterMarkdownProps {
  content: string;
  isGenerating?: boolean;
  speed?: number; // 每个字符的延迟时间(ms)
  className?: string;
  components?: any;
  entities?: Entity[]; // NER识别的实体列表
}

/**
 * 查找文本中所有代码块的位置范围（包括行内代码和代码块）
 */
function findCodeBlockRanges(text: string): Array<{start: number, end: number}> {
  const ranges: Array<{start: number, end: number}> = [];

  // 查找三个反引号的代码块 ```code```
  const blockRegex = /```[\s\S]*?```/g;
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }

  // 查找行内代码块 `code`
  const inlineRegex = /`[^`]+`/g;
  while ((match = inlineRegex.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }

  return ranges;
}

/**
 * 检查实体是否在代码块内
 */
function isEntityInCodeBlock(entity: Entity, codeRanges: Array<{start: number, end: number}>): boolean {
  return codeRanges.some(range =>
    entity.start >= range.start && entity.end <= range.end
  );
}

/**
 * 处理实体高亮：将纯文本content根据entities信息包裹高亮组件
 * 使用特殊的HTML标签标记实体，利用rehype-raw解析
 * 过滤掉代码块内的实体，保持代码块的语义完整性
 */
function processEntitiesInText(text: string, entities?: Entity[]): string {
  if (!entities || entities.length === 0) {
    return text;
  }

  // 找出所有代码块的位置
  const codeRanges = findCodeBlockRanges(text);

  // 过滤掉在代码块内的实体
  const filteredEntities = entities.filter(entity => !isEntityInCodeBlock(entity, codeRanges));

  if (filteredEntities.length === 0) {
    return text;
  }

  // 按start排序，确保从前往后处理（优先级从前到后）
  const sortedEntities = [...filteredEntities].sort((a, b) => a.start - b.start);

  let result = "";
  let lastIndex = 0;

  for (const entity of sortedEntities) {
    // 添加实体之前的文本
    const beforeText = text.slice(lastIndex, entity.start);
    result += beforeText;

    // 添加实体文本 - 使用HTML标签
    const entityText = text.slice(entity.start, entity.end);
    // 使用data属性传递实体信息
    result += `<mark data-entity-type="${entity.type}" data-entity-name="${entity.text}">${entityText}</mark>`;

    lastIndex = entity.end;
  }

  // 添加剩余文本
  result += text.slice(lastIndex);

  return result;
}

export function TypeWriterMarkdown({
  content,
  isGenerating = false,
  speed = 20, // 默认20ms一个字符，非常流畅
  className,
  components,
  entities
}: TypeWriterMarkdownProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const contentRef = useRef(content);
  const displayedLengthRef = useRef(0);
  const isInitialMountRef = useRef(true); // 追踪是否是初始加载

  // 初始化：如果是历史对话（已有完整内容且不在生成），直接显示
  useEffect(() => {
    if (isInitialMountRef.current && content && !isGenerating) {
      debug.log('⚡ 初始加载：直接显示全部内容（历史对话）', {
        contentLength: content.length,
        isGenerating,
        contentPreview: content.slice(0, 100)
      });
      setDisplayedContent(content);
      displayedLengthRef.current = content.length;
      contentRef.current = content;
      isInitialMountRef.current = false;
      return;
    }

    // 标记初始化完成
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
    }
  }, []);

  // 当content变化时，检测是否需要启动打字效果
  useEffect(() => {
    // 跳过初始加载
    if (isInitialMountRef.current) return;

    const now = Date.now();
    const newContent = content;
    const currentDisplayedLength = displayedLengthRef.current;

    // 如果content增长了，启动打字效果
    if (newContent.length > currentDisplayedLength) {
      debug.log('📥 接收到新content', {
        时间戳: now,
        newLength: newContent.length,
        currentDisplayed: currentDisplayedLength,
        增量: newContent.length - currentDisplayedLength,
        isTyping,
        isGenerating,
        contentPreview: newContent.slice(0, 100)
      });
      contentRef.current = newContent;

      // 如果当前没在打字，启动打字
      if (!isTyping) {
        debug.log('⌨️ 启动打字效果');
        setIsTyping(true);
      }
    }
  }, [content, isTyping, isGenerating]);

  // 打字效果的核心逻辑
  useEffect(() => {
    if (!isTyping) return;

    const targetContent = contentRef.current;
    const currentLength = displayedLengthRef.current;

    // 如果已经显示完毕
    if (currentLength >= targetContent.length) {
      setIsTyping(false);
      return;
    }

    // 使用setTimeout实现打字效果
    const timer = setTimeout(() => {
      // 每次增加1-3个字符，让效果更自然
      const step = Math.floor(Math.random() * 3) + 1;
      const newLength = Math.min(currentLength + step, targetContent.length);
      const newDisplayedContent = targetContent.slice(0, newLength);

      setDisplayedContent(newDisplayedContent);
      displayedLengthRef.current = newLength;
    }, speed);

    return () => clearTimeout(timer);
  }, [isTyping, speed, displayedContent]);

  // 处理实体高亮
  // 只在打字效果完成后才处理实体,确保NER的start/end索引能正确匹配完整内容
  const shouldProcessEntities = !isTyping && entities && entities.length > 0;

  if (shouldProcessEntities) {
    debug.log('🎯 开始处理实体高亮', {
      entitiesCount: entities?.length,
      contentLength: displayedContent.length,
      entities: entities?.map(e => ({ text: e.text, type: e.type, start: e.start, end: e.end }))
    });
  }

  // 处理实体 - 在markdown文本中插入HTML标签
  const contentWithEntities = useMemo(() => {
    if (!shouldProcessEntities) {
      return displayedContent;
    }
    return processEntitiesInText(displayedContent, entities);
  }, [displayedContent, shouldProcessEntities, entities]);

  // 自定义markdown组件 - 将<mark>标签渲染为EntityHighlight组件
  const customComponents = useMemo(() => {
    return {
      ...components,
      mark: ({ node, ...props }: any) => {
        const entityType = props['data-entity-type'] as EntityCategory;
        const entityName = props['data-entity-name'] as string;

        if (entityType && entityName) {
          return (
            <EntityHighlight entity={entityName} type={entityType}>
              {props.children}
            </EntityHighlight>
          );
        }

        // 默认的mark标签渲染
        return <mark {...props} />;
      }
    };
  }, [components]);

  return (
    <div className={cn("prose prose-slate dark:prose-invert max-w-none", className)}>
      <Streamdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={customComponents}
      >
        {contentWithEntities}
      </Streamdown>
    </div>
  );
}
