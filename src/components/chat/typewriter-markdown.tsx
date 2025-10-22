"use client";

import { useEffect, useState, useRef } from "react";
import { Streamdown } from "streamdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

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

  // 当content变化时，检测是否需要启动打字效果
  useEffect(() => {
    const newContent = content;
    const currentDisplayedLength = displayedLengthRef.current;

    // 如果content增长了，启动打字效果
    if (newContent.length > currentDisplayedLength) {
      contentRef.current = newContent;

      // 如果当前没在打字，启动打字
      if (!isTyping) {
        setIsTyping(true);
      }
    }
  }, [content, isTyping]);

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

  // 如果不在生成中，且已经有完整内容，直接显示
  useEffect(() => {
    if (!isGenerating && content && !isTyping) {
      setDisplayedContent(content);
      displayedLengthRef.current = content.length;
    }
  }, [isGenerating, content, isTyping]);

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
