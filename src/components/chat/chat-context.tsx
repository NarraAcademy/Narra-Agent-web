"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  updateMessage: (messageId: string, content: string) => void;
  currentMessages: Message[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = "narra-agent-conversations";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  // 从localStorage加载数据
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setConversations(data.conversations || []);
        setCurrentConversationId(data.currentConversationId || null);
      } catch (e) {
        console.error("Failed to load conversations", e);
      }
    } else {
      // 首次访问，显示欢迎页
      setCurrentConversationId(null);
    }
  }, []);

  // 保存到localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ conversations, currentConversationId })
      );
    }
  }, [conversations, currentConversationId]);

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
    setCurrentConversationId(newConv.id);
    return newConv.id;
  };

  // 公开函数：点击 New Chat 时调用，只是回到欢迎页
  const createConversation = () => {
    setCurrentConversationId(null);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      // 如果还有剩余对话，切换到第一个；否则回到欢迎页
      setCurrentConversationId(remaining[0]?.id || null);
    }
  };

  const renameConversation = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c))
    );
  };

  const setCurrentConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const addMessage = (message: Omit<Message, "id" | "timestamp">, conversationId?: string) => {
    // 使用传入的 conversationId 或当前的 currentConversationId
    const targetConversationId = conversationId || currentConversationId;
    if (!targetConversationId) return "";

    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConversationId) {
          const updatedMessages = [...c.messages, newMessage];
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
      })
    );

    return newMessage.id;
  };

  const updateMessage = (messageId: string, content: string) => {
    if (!currentConversationId) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentConversationId) {
          return {
            ...c,
            messages: c.messages.map((msg) =>
              msg.id === messageId ? { ...msg, content } : msg
            ),
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );
  };

  const currentMessages =
    conversations.find((c) => c.id === currentConversationId)?.messages || [];

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
        currentMessages,
        isLoading,
        setIsLoading,
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
