import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Conversation, Message, Step, MessageMetadata } from '@/types/chat';

/**
 * useChat hook 返回的消息格式
 */
interface UseChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
  data?: {
    steps?: Step[];
    metadata?: MessageMetadata;
  };
}

interface ChatStore {
  // State
  conversations: Conversation[];
  isLoading: boolean;
  generatingMessageId: string | null;

  // Actions
  createNewConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, "id" | "createdAt">) => string;
  updateMessageField: <K extends keyof Message>(
    conversationId: string,
    messageId: string,
    field: K,
    value: Message[K]
  ) => void;
  syncConversationFromUseChat: (conversationId: string, messages: UseChatMessage[]) => void;
  setIsLoading: (loading: boolean) => void;
  setGeneratingMessageId: (id: string | null) => void;

  // Computed getters
  getConversationById: (id: string) => Conversation | undefined;
  getMessages: (conversationId: string) => Message[];
}

const STORAGE_KEY = "narra-agent-conversations";

/**
 * 生成对话标题：默认标题"新对话"时使用用户首条消息前20字符
 */
function generateTitle(currentTitle: string, firstUserMessage?: string): string {
  if (currentTitle !== "新对话" || !firstUserMessage) return currentTitle;
  return firstUserMessage.length > 20
    ? firstUserMessage.slice(0, 20) + "..."
    : firstUserMessage;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      isLoading: false,
      generatingMessageId: null,

      createNewConversation: () => {
        const id = Date.now().toString();
        const newConv: Conversation = {
          id,
          title: "新对话",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [newConv, ...state.conversations],
        }));
        return id;
      },

      deleteConversation: (id: string) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
        }));
      },

      renameConversation: (id: string, title: string) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
          ),
        }));
      },

      addMessage: (conversationId: string, message: Omit<Message, "id" | "createdAt">) => {
        const newMessage: Message = {
          ...message,
          id: Date.now().toString(),
          createdAt: Date.now(),
        };

        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id === conversationId) {
              const updatedMessages = [...c.messages, newMessage];
              const title = message.role === "user"
                ? generateTitle(c.title, message.content)
                : c.title;

              return {
                ...c,
                messages: updatedMessages,
                title,
                updatedAt: Date.now(),
              };
            }
            return c;
          }),
        }));

        return newMessage.id;
      },

      /**
       * 更新消息的任意字段，类型安全
       */
      updateMessageField: <K extends keyof Message>(
        conversationId: string,
        messageId: string,
        field: K,
        value: Message[K]
      ) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, [field]: value } : msg
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        }));
      },

      syncConversationFromUseChat: (conversationId: string, useChatMessages: UseChatMessage[]) => {
        if (!conversationId) return;

        // 转换useChat的Message格式为我们的Message格式
        const convertedMessages: Message[] = useChatMessages.map((msg) => ({
          id: msg.id || `${Date.now()}-${Math.random()}`,
          role: msg.role,
          content: msg.content || "",
          steps: msg.data?.steps || [],
          metadata: msg.data?.metadata,
          createdAt: msg.createdAt?.getTime() || Date.now(),
        }));

        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id === conversationId) {
              const firstUserMsg = convertedMessages.find(m => m.role === "user");
              const title = generateTitle(c.title, firstUserMsg?.content);

              return {
                ...c,
                messages: convertedMessages,
                title,
                updatedAt: Date.now(),
              };
            }
            return c;
          }),
        }));
      },

      setIsLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setGeneratingMessageId: (id: string | null) => {
        set({ generatingMessageId: id });
      },

      // Computed getters
      getConversationById: (id: string) => {
        return get().conversations.find(c => c.id === id);
      },

      getMessages: (conversationId: string) => {
        const conv = get().getConversationById(conversationId);
        return conv?.messages || [];
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations
      }),
    }
  )
);
