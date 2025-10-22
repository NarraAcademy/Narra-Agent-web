"use client";

import { useEffect, useState, useRef } from "react";
import { Streamdown } from "streamdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";
import { createDebug } from "@/lib/debug";

const debug = createDebug('TypeWriterMarkdown');

interface TypeWriterMarkdownProps {
  content: string;
  isGenerating?: boolean;
  speed?: number; // 每个字符的延迟时间(ms)
  className?: string;
  components?: any;
}

export function TypeWriterMarkdown({
  content,
  isGenerating = false,
  speed = 20, // 默认20ms一个字符，非常流畅
  className,
  components
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

  return (
    <div className={cn("prose prose-slate dark:prose-invert max-w-none", className)}>
      <Streamdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={components}
      >
        {displayedContent}
      </Streamdown>
    </div>
  );
}
