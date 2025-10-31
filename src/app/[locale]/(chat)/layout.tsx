"use client";

import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export default function ChatLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
        {/* 移动端侧边栏遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 侧边栏 */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 md:relative transition-all duration-300 border-r border-border",
            "md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <ChatSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 移动端顶部菜单按钮 */}
          <div className="md:hidden px-4 py-2 flex items-center justify-between bg-background border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <Cross1Icon className="w-5 h-5" />
              ) : (
                <HamburgerMenuIcon className="w-5 h-5" />
              )}
            </Button>
            <span className="font-semibold">Narra Agent</span>
            <div className="w-10" />
          </div>

          {children}
        </div>
      </div>
  );
}
