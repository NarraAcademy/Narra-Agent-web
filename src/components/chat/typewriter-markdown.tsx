"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Streamdown } from "streamdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { createDebug } from "@/lib/debug";
import { EntityHighlight } from "./entity-highlight";
import remarkEntityHighlight from "@/lib/remark-entity-highlight";
import type { Entity as NEREntity } from "@/lib/remark-entity-highlight";

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
 * 将后端 NER 格式转换为 remark plugin 需要的格式
 * 后端格式: { text, type, start, end }
 * Plugin格式: { type, name, mentions: [{ text }] }
 */
function convertNEREntitiesToPluginFormat(entities?: Entity[]): NEREntity[] {
  if (!entities || entities.length === 0) return [];

  // 简单去重：同类型+同文本的实体只保留一个
  const seen = new Set<string>();
  return entities
    .filter(e => {
      const key = `${e.type}-${e.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(e => ({
      type: e.type,
      name: e.text,
      mentions: [{ text: e.text }]
    }));
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

  // 转换 entities 格式用于 remark plugin
  const pluginEntities = useMemo(() => {
    const converted = convertNEREntitiesToPluginFormat(entities);
    if (converted.length > 0) {
      debug.log('🔄 实体格式转换完成', {
        原始数量: entities?.length,
        转换后数量: converted.length,
        示例: converted.slice(0, 3)
      });
    }
    return converted;
  }, [entities]);

  // 自定义 markdown 组件 - 映射 <entity-highlight> HTML 标签到 EntityHighlight 组件
  const customComponents = useMemo(() => {
    return {
      ...components,
      // 映射 rehypeRaw 解析的 entity-highlight HTML 元素到 React 组件
      'entity-highlight': ({ node, children, ...props }: any) => {
        const type = props['data-type'] as EntityCategory;
        const name = props['data-name'];

        return (
          <EntityHighlight entity={name} type={type}>
            {children}
          </EntityHighlight>
        );
      },
    };
  }, [components]);

  return (
    <div className={cn("prose prose-slate dark:prose-invert max-w-none", className)}>
      <Streamdown
        remarkPlugins={[
          remarkGfm,
          [remarkEntityHighlight, pluginEntities] // 添加实体高亮 plugin
        ]}
        rehypePlugins={[rehypeRaw]} // 解析 plugin 注入的 HTML 标签
        components={customComponents}
      >
        {displayedContent}
      </Streamdown>
    </div>
  );
}
