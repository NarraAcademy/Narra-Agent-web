"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

// Agent名称类型
export type AgentName = "Coordinator" | "CoinGecko" | "Project" | "News" | "Synthesizer" | "System";

// 推理小步骤
export interface ReasoningStep {
  id: string;
  content: string; // 推理内容（后端字段名是content）
  agent: string; // Agent名称（后端字段名是agent）
  category?: "search" | "browse" | "analyze" | "tool_call" | "status" | "info"; // 可选的分类标签
  metadata?: Record<string, any>; // 元数据，如 {url: "...", duration: 1.5}
  step_id?: string; // 所属大步骤ID（可选）
  timestamp?: string; // ISO 8601格式时间戳（可选）
}

// 工作流大步骤
export interface WorkflowStep {
  id: string; // 步骤ID（step_id）
  title?: string; // 步骤标题
  agent?: AgentName; // Agent名称（使用严格类型）
  status?: "pending" | "running" | "completed" | "error";
  reasoning: ReasoningStep[]; // 该步骤下的推理列表
  timestamp?: string; // ISO 8601格式时间戳
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string; // 旧版思考过程(向后兼容)
  steps?: WorkflowStep[]; // 新版工作流步骤
  metadata?: {
    // complete事件的元数据
    tools_used?: string[];
    agents_used?: string | string[];
  };
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  createConversation: () => void;
  createNewConversation: () => string; // 内部函数，返回新对话ID
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  setCurrentConversation: (id: string) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">, conversationId?: string) => string; // 返回消息ID，可指定对话ID
  updateMessage: (messageId: string, content: string, conversationId?: string) => void; // 可指定对话ID
  updateMessageSteps: (messageId: string, steps: WorkflowStep[], conversationId?: string) => void; // 可指定对话ID
  updateMessageMetadata: (messageId: string, metadata: Message["metadata"], conversationId?: string) => void; // 可指定对话ID
  currentMessages: Message[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  generatingMessageId: string | null; // 正在生成的消息ID
  setGeneratingMessageId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = "narra-agent-conversations";

// 导出的辅助函数：根据as-needed模式生成路径前缀
export function getPathPrefix(locale: string): string {
  // as-needed模式：默认locale(en)不需要前缀，其他locale需要
  return (locale && locale !== 'en') ? `/${locale}` : '';
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingMessageId, setGeneratingMessageId] = useState<string | null>(null);
  const [isConversationsLoaded, setIsConversationsLoaded] = useState(false);

  // 从URL读取currentConversationId（URL是唯一真实来源）
  const currentConversationId = (params?.id as string) || null;

  // 记录最近创建的conversationId，避免验证时误判
  const recentlyCreatedIdRef = React.useRef<string | null>(null);

  // 辅助函数：根据as-needed模式生成路径前缀
  const getPathPrefix = () => {
    // as-needed模式：默认locale(en)不需要前缀，其他locale需要
    return (locale && locale !== 'en') ? `/${locale}` : '';
  };

  // 从localStorage加载数据
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setConversations(data.conversations || []);
      } catch (e) {
        console.error("Failed to load conversations", e);
      }
    }
    // 标记加载完成
    setIsConversationsLoaded(true);
  }, []);

  // 保存到localStorage（只保存conversations，不保存currentConversationId）
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ conversations })
      );
    }
  }, [conversations]);

  // 验证URL中的conversationId是否存在
  useEffect(() => {
    // 只有在localStorage加载完成后才验证
    if (!isConversationsLoaded) {
      return;
    }

    if (currentConversationId) {
      // 跳过刚创建的对话ID验证
      if (recentlyCreatedIdRef.current === currentConversationId) {
        return;
      }

      const exists = conversations.some(c => c.id === currentConversationId);
      if (!exists) {
        // ID不存在，重定向到根路径
        const pathPrefix = getPathPrefix();
        router.replace(pathPrefix || '/');
      }
    }
  }, [currentConversationId, conversations, isConversationsLoaded, router, locale]);

  // 内部函数：真正创建新对话对象
  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "新对话",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);

    // 记录新创建的ID，用于跳过验证
    recentlyCreatedIdRef.current = newConv.id;

    // 2秒后清除标记（给足够时间让对话保存到localStorage）
    setTimeout(() => {
      if (recentlyCreatedIdRef.current === newConv.id) {
        recentlyCreatedIdRef.current = null;
      }
    }, 2000);

    return newConv.id;
  };

  // 公开函数：点击 New Chat 时调用，跳转到 /chat
  const createConversation = () => {
    const pathPrefix = getPathPrefix();
    router.push(`${pathPrefix}/chat`);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      const pathPrefix = getPathPrefix();
      // 如果还有剩余对话，跳转到第一个；否则回到欢迎页
      if (remaining[0]) {
        router.push(`${pathPrefix}/chat/${remaining[0].id}`);
      } else {
        router.push(pathPrefix || '/');
      }
    }
  };

  const renameConversation = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c))
    );
  };

  const setCurrentConversation = (id: string) => {
    const pathPrefix = getPathPrefix();
    router.push(`${pathPrefix}/chat/${id}`);
  };

  const addMessage = (message: Omit<Message, "id" | "timestamp">, conversationId?: string) => {
    // 使用传入的 conversationId 或当前的 currentConversationId
    const targetConversationId = conversationId || currentConversationId;

    console.log("[ChatContext] ========== addMessage START ==========");
    console.log("[ChatContext] addMessage 参数:", {
      role: message.role,
      contentLength: message.content.length,
      conversationId: targetConversationId
    });

    if (!targetConversationId) {
      console.warn("[ChatContext] addMessage: 没有提供 conversationId");
      return "";
    }

    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    console.log("[ChatContext] 创建新消息, ID:", newMessage.id);

    setConversations((prev) => {
      console.log("[ChatContext] addMessage setConversations 回调执行");
      console.log("[ChatContext] 当前 conversations 数量:", prev.length);
      const targetConv = prev.find(c => c.id === targetConversationId);
      console.log("[ChatContext] 目标对话存在:", !!targetConv);

      const result = prev.map((c) => {
        if (c.id === targetConversationId) {
          const updatedMessages = [...c.messages, newMessage];
          console.log("[ChatContext] 添加消息前数量:", c.messages.length);
          console.log("[ChatContext] 添加消息后数量:", updatedMessages.length);

          // 自动生成标题（使用第一条用户消息的前20个字符）
          const title =
            c.title === "新对话" && message.role === "user"
              ? message.content.slice(0, 20) + (message.content.length > 20 ? "..." : "")
              : c.title;

          return {
            ...c,
            messages: updatedMessages,
            title,
            updatedAt: Date.now(),
          };
        }
        return c;
      });

      console.log("[ChatContext] ========== addMessage END ==========");
      return result;
    });

    return newMessage.id;
  };

  const updateMessage = (messageId: string, content: string, conversationId?: string) => {
    // 使用传入的 conversationId 或当前的 currentConversationId
    const targetConversationId = conversationId || currentConversationId;

    if (!targetConversationId) {
      console.warn("[ChatContext] updateMessage called but no conversationId provided");
      return;
    }

    console.log("[ChatContext] ========== updateMessage START ==========");
    console.log("[ChatContext] updateMessage 参数:", {
      conversationId: targetConversationId,
      messageId: messageId,
      contentLength: content.length,
      contentPreview: content.slice(0, 100)
    });

    console.log("[ChatContext] 准备调用 setConversations");
    setConversations((prev) => {
      console.log("[ChatContext] setConversations 回调开始执行, prev.length:", prev.length);
      const targetConv = prev.find(c => c.id === targetConversationId);
      console.log("[ChatContext] 目标对话存在:", !!targetConv);
      if (targetConv) {
        console.log("[ChatContext] 目标对话消息数量:", targetConv.messages.length);
        const targetMsg = targetConv.messages.find(m => m.id === messageId);
        console.log("[ChatContext] 目标消息存在:", !!targetMsg);
        if (targetMsg) {
          console.log("[ChatContext] 更新前消息内容长度:", targetMsg.content.length);
          console.log("[ChatContext] 更新后消息内容长度:", content.length);
        }
      }

      const updated = prev.map((c) => {
        if (c.id === targetConversationId) {
          const updatedMessages = c.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content } : msg
          );
          const result = {
            ...c,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
          console.log("[ChatContext] 对话更新后消息数量:", result.messages.length);
          return result;
        }
        return c;
      });

      console.log("[ChatContext] ========== updateMessage END ==========");
      return updated;
    });
    console.log("[ChatContext] setConversations 调用完成");
  };

  const updateMessageSteps = (messageId: string, steps: WorkflowStep[], conversationId?: string) => {
    const targetConversationId = conversationId || currentConversationId;
    if (!targetConversationId) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConversationId) {
          return {
            ...c,
            messages: c.messages.map((msg) =>
              msg.id === messageId ? { ...msg, steps } : msg
            ),
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );
  };

  const updateMessageMetadata = (messageId: string, metadata: Message["metadata"], conversationId?: string) => {
    const targetConversationId = conversationId || currentConversationId;
    if (!targetConversationId) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConversationId) {
          return {
            ...c,
            messages: c.messages.map((msg) =>
              msg.id === messageId ? { ...msg, metadata } : msg
            ),
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );
  };

  const currentConversation = conversations.find((c) => c.id === currentConversationId);
  const currentMessages = currentConversation?.messages || [];

  console.log("[ChatContext] currentMessages计算:", {
    currentConversationId,
    found: !!currentConversation,
    messagesCount: currentMessages.length
  });

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversationId,
        createConversation,
        createNewConversation,
        deleteConversation,
        renameConversation,
        setCurrentConversation,
        addMessage,
        updateMessage,
        updateMessageSteps,
        updateMessageMetadata,
        currentMessages,
        isLoading,
        setIsLoading,
        generatingMessageId,
        setGeneratingMessageId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
