"use client";

import { useTranslations, useLocale } from "next-intl";
import { useChatContext } from "./chat-context";
import { ChatUserSection } from "./chat-user-section";
import { ChatSearchDialog } from "./chat-search-dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChatBubbleIcon,
  DotsVerticalIcon,
  ChevronLeftIcon,
  BarChartIcon,
} from "@radix-ui/react-icons";
import { LuPanelLeft as PinLeftIcon } from "react-icons/lu";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export function ChatSidebar({
  collapsed = false,
  onToggleCollapse,
  onClose,
}: ChatSidebarProps) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const router = useRouter();
  const {
    conversations,
    currentConversationId,
    createConversation,
    deleteConversation,
    setCurrentConversation,
    renameConversation,
  } = useChatContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  const handleRename = (id: string) => {
    const trimmedTitle = editTitle.trim();

    // 验证空标题
    if (!trimmedTitle) {
      setEditingId(null);
      setEditTitle("");
      return;
    }

    // 验证长度（最大 100 字符）
    if (trimmedTitle.length > 100) {
      // 如果需要可以添加 toast 提示
      console.warn("Title too long, max 100 characters");
      return;
    }

    // 只有标题真正改变时才更新
    const originalTitle = conversations.find((c) => c.id === id)?.title;
    if (trimmedTitle !== originalTitle) {
      renameConversation(id, trimmedTitle);
    }

    setEditingId(null);
    setEditTitle("");
  };

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  return (
    <div
      className={cn(
        "h-screen bg-background flex flex-col transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[300px]"
      )}
    >
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        {!collapsed && (
          <Link
            href="/home"
            className="text-lg font-semibold hover:text-primary transition-colors"
          >
            Narra Agent
          </Link>
        )}
        <PinLeftIcon
          className={cn(
            "w-5 h-5 transition-transform cursor-pointer shrink-0 hover:text-primary",
            collapsed ? "mx-auto" : "md:block hidden"
          )}
          onClick={onToggleCollapse}
        />
        <ChevronLeftIcon
          className="w-5 h-5 cursor-pointer shrink-0 hover:text-primary transition-colors md:hidden"
          onClick={onClose}
        />
      </div>

      <div className="space-y-2 pb-2 border-b border-gray-800">
        {/* 新建对话按钮 */}
        {!collapsed ? (
          <div
            onClick={createConversation}
            className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
          >
            <PlusIcon className="w-5 h-5 shrink-0" />
            <span className="text-sm">{t("new_chat")}</span>
          </div>
        ) : (
          <div className="p-3 flex justify-center">
            <PlusIcon
              onClick={createConversation}
              className="w-5 h-5 cursor-pointer shrink-0 hover:text-primary transition-colors"
              aria-label="New chat"
              role="button"
            />
          </div>
        )}

        {/* 搜索按钮 */}
        {!collapsed ? (
          <div
            onClick={() => setSearchDialogOpen(true)}
            className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
          >
            <MagnifyingGlassIcon className="w-5 h-5 shrink-0" />
            <span className="text-sm">
              {t("search_placeholder")}
            </span>
          </div>
        ) : (
          <div className="p-3 flex justify-center">
            <MagnifyingGlassIcon
              className="w-5 h-5 cursor-pointer shrink-0 hover:text-primary transition-colors"
              onClick={() => setSearchDialogOpen(true)}
              aria-label="Search"
              role="button"
            />
          </div>
        )}

        {/* 加密数据中心按钮 */}
        {!collapsed ? (
          <div
            onClick={() => router.push(`/${locale}/analytics`)}
            className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
          >
            <BarChartIcon className="w-5 h-5 shrink-0" />
            <span className="text-sm">{t("analytics")}</span>
          </div>
        ) : (
          <div className="p-3 flex justify-center">
            <BarChartIcon
              onClick={() => router.push(`/${locale}/analytics`)}
              className="w-5 h-5 cursor-pointer shrink-0 hover:text-primary transition-colors"
              aria-label="Analytics"
              role="button"
            />
          </div>
        )}
      </div>

      {/* 对话列表 */}
      <ScrollArea className="flex-1">
        {!collapsed && (
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                {t("no_conversations")}
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group rounded-lg cursor-pointer hover:bg-accent transition-colors p-2",
                    currentConversationId === conv.id && "bg-accent"
                  )}
                  onClick={() => setCurrentConversation(conv.id)}
                >
                  {editingId === conv.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleRename(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(conv.id);
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setEditTitle("");
                        }
                      }}
                      autoFocus
                      className="h-6 text-sm"
                      aria-label="Rename conversation"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <ChatBubbleIcon className="w-5 h-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.updatedAt).toLocaleDateString(
                            locale === "zh" ? "zh-CN" : "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>

                      {/* 操作菜单 */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pointer-events-none group-hover:pointer-events-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <DotsVerticalIcon
                              className="w-5 h-5 cursor-pointer hover:text-primary transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="More actions"
                              role="button"
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(conv.id, conv.title);
                              }}
                              className="cursor-pointer"
                            >
                              {t("rename")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(t("delete_confirm"))) {
                                  deleteConversation(conv.id);
                                }
                              }}
                              className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10"
                            >
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>

      {/* 底部用户信息区 */}
      <ChatUserSection collapsed={collapsed} />

      {/* 搜索弹窗 */}
      <ChatSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
      />
    </div>
  );
}
