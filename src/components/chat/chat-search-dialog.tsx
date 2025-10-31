"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useChatStore } from "@/stores/chat-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MagnifyingGlassIcon,
  Cross2Icon,
  ChatBubbleIcon,
  PlusCircledIcon
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

interface ChatSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 日期分组类型
type DateGroup = "today" | "yesterday" | "this_week" | "last_week" | "earlier";

// 对话分组数据
interface ConversationGroup {
  group: DateGroup;
  conversations: Array<{
    id: string;
    title: string;
    updatedAt: number;
  }>;
}

export function ChatSearchDialog({ open, onOpenChange }: ChatSearchDialogProps) {
  const t = useTranslations("chat.search_dialog");
  const tChat = useTranslations("chat");
  const router = useRouter();
  const { conversations, createNewConversation } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");

  // 获取日期分组
  const getDateGroup = (date: Date): DateGroup => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const conversationDate = new Date(date);
    const conversationDay = new Date(
      conversationDate.getFullYear(),
      conversationDate.getMonth(),
      conversationDate.getDate()
    );

    if (conversationDay.getTime() === today.getTime()) {
      return "today";
    } else if (conversationDay.getTime() === yesterday.getTime()) {
      return "yesterday";
    } else if (conversationDate >= weekAgo) {
      return "this_week";
    } else if (conversationDate >= twoWeeksAgo) {
      return "last_week";
    } else {
      return "earlier";
    }
  };

  // 过滤和分组对话
  const groupedConversations = useMemo(() => {
    // 过滤对话
    const filtered = conversations.filter((conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 按日期分组
    const groups: Map<DateGroup, ConversationGroup["conversations"]> = new Map();

    filtered.forEach((conv) => {
      const group = getDateGroup(new Date(conv.updatedAt));
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(conv);
    });

    // 转换为数组并排序
    const groupOrder: DateGroup[] = ["today", "yesterday", "this_week", "last_week", "earlier"];
    const result: ConversationGroup[] = [];

    groupOrder.forEach((group) => {
      const convs = groups.get(group);
      if (convs && convs.length > 0) {
        result.push({
          group,
          conversations: convs.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ),
        });
      }
    });

    return result;
  }, [conversations, searchQuery]);

  // 处理对话点击
  const handleConversationClick = (id: string) => {
    router.push(`/chat/${id}`);
    onOpenChange(false);
    setSearchQuery("");
  };

  // 处理新建对话
  const handleNewChat = () => {
    router.push('/chat');
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        {/* 头部 */}
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle>{t("title")}</DialogTitle>
          
          </div>
        </DialogHeader>

        {/* 搜索框 */}
        <div className="px-6 py-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
              autoFocus
            />
          </div>
        </div>

        {/* 新建对话按钮 */}
        <div className="px-6 pb-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleNewChat}
          >
            <PlusCircledIcon className="w-4 h-4" />
            {tChat("new_chat")}
          </Button>
        </div>

        {/* 对话列表 */}
        <ScrollArea className="max-h-[400px]">
          <div className="px-6 pb-6">
            {groupedConversations.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                {searchQuery ? t("no_results") : tChat("no_conversations")}
              </div>
            ) : (
              <div className="space-y-6">
                {groupedConversations.map((group) => (
                  <div key={group.group}>
                    {/* 分组标题 */}
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                      {t(group.group)}
                    </div>
                    {/* 对话列表 */}
                    <div className="space-y-1">
                      {group.conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => handleConversationClick(conv.id)}
                        >
                          <ChatBubbleIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm flex-1 truncate">{conv.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
