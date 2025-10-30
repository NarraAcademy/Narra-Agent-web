"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

/**
 * 目录组件
 * - 固定在右侧
 * - 自动高亮当前可见章节
 * - 点击平滑滚动到对应章节
 * - 桌面端显示，移动端隐藏
 */
export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // 使用 Intersection Observer 检测当前可见章节
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -80% 0px", // 顶部 100px 处触发
        threshold: 0.1,
      }
    );

    // 观察所有章节
    items.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [items]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // 平滑滚动到目标章节
      const yOffset = -80; // 考虑固定头部的偏移
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <nav className="hidden lg:block sticky top-6 self-start w-64 shrink-0">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground mb-3">
          On This Page
        </p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleClick(item.id)}
                className={cn(
                  "text-left w-full text-sm transition-colors hover:text-foreground",
                  item.level === 2 && "pl-4",
                  activeId === item.id
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
