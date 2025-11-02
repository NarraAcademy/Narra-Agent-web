"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useSSEChat } from "@/hooks/use-sse-chat";
import { useChatStore } from "@/stores/chat-store";
import { ChatMessage, fetchEntities } from "./chat-message";
import { ChatInput } from "./chat-input";
import { EmptyChatInput } from "./empty-chat-input";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StickToBottom } from "use-stick-to-bottom";
import { createDebug } from "@/lib/debug";

const debug = createDebug('ChatConversation');

export function ChatConversation() {
  const t = useTranslations("chat");
  const router = useRouter();
  const params = useParams();

  // ✅ 使用 Zustand Store - 移除所有ref
  const {
    conversations,
    createNewConversation,
    syncConversationFromUseChat,
    addMessage,
    getMessages,
    updateMessageField,
    activeConversationId,
    setActiveConversationId,
    isConversationAutoSent,
    markConversationAsSent,
    isMessageProcessed,
    markMessageAsProcessed,
  } = useChatStore();

  // 从 URL 读取当前对话 ID
  const conversationId = (params?.id as string) || null;
  const currentMessages = conversationId ? getMessages(conversationId) : [];

  // 本地输入框状态 (AI SDK 5.0 不再提供 input/handleInputChange)
  const [input, setInput] = useState("");

  // 使用自定义 useSSEChat hook 直接连接后端SSE流
  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useSSEChat({
    id: (params?.id as string) || undefined,
    onFinish: (message) => {
      debug.log("AI响应完成", message);
    },
    onError: (error: Error) => {
      debug.error("useChat错误", error);
    },
  });

  // 兼容旧代码: isLoading 映射到 status
  const isLoading = status === "submitted" || status === "streaming";

  // 本地 handleInputChange 实现
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // ✅ 简化：当AI消息完成时保存到localStorage
  useEffect(() => {
    if (!conversationId || isLoading || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant" || isMessageProcessed(lastMessage.id)) return;

    const content = lastMessage.content || '';
    if (content.length === 0) return; // 避免覆盖历史数据

    debug.log('保存AI消息到localStorage', lastMessage.id);
    markMessageAsProcessed(lastMessage.id);

    const useChatMessages = messages.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content || '',
      createdAt: new Date(),
      data: {
        steps: msg.steps || [],
        metadata: msg.metadata,
      }
    }));

    syncConversationFromUseChat(conversationId, useChatMessages);

    // 🔧 调用NER API识别实体并保存
    if (content.length > 0) {
      fetchEntities(content).then((entities) => {
        if (entities.length > 0) {
          debug.log('✅ NER识别完成，保存entities到消息', { messageId: lastMessage.id, entitiesCount: entities.length });
          updateMessageField(conversationId, lastMessage.id, 'entities', entities);
        }
      }).catch((error) => {
        debug.error('❌ NER识别失败', error);
      });
    }
  }, [messages, isLoading, conversationId, updateMessageField, markMessageAsProcessed, syncConversationFromUseChat]);

  // ✅ 简化：对话切换时同步数据
  useEffect(() => {
    if (activeConversationId === conversationId) return;

    debug.log('对话切换', { from: activeConversationId, to: conversationId });
    setActiveConversationId(conversationId);

    if (!conversationId) {
      // 回到 /chat 页面，清空消息
      if (messages.length > 0) setMessages([]);
      return;
    }

    if (currentMessages.length === 0) {
      debug.log('等待对话数据加载');
      return;
    }

    // 检查是否需要自动发送
    const hasOnlyOneUserMessage = currentMessages.length === 1 && currentMessages[0].role === "user";
    const notSentYet = !isConversationAutoSent(conversationId);

    if (hasOnlyOneUserMessage && notSentYet && !isLoading) {
      debug.log('自动发送新对话');
      markConversationAsSent(conversationId);

      const storageKey = `pending_useDeepThinking_${conversationId}`;
      const useDeepThinking = JSON.parse(localStorage.getItem(storageKey) || 'false');
      localStorage.removeItem(storageKey);

      sendMessage(currentMessages[0].content, useDeepThinking);
    } else {
      // 同步localStorage到useChat
      debug.log('同步消息', currentMessages.length);
      const useChatMessages = currentMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        steps: msg.steps,
        metadata: msg.metadata,
      }));
      setMessages(useChatMessages as any);
    }
  }, [conversationId, activeConversationId, currentMessages.length, isLoading]);

  const currentConversation = conversations.find(c => c.id === conversationId);

  const handleSend = async (message: string, useDeepThinking: boolean) => {
    debug.log('开始发送消息', `${message.slice(0, 50)} | useDeepThinking: ${useDeepThinking}`);

    // 场景1：在 /chat 页面发送消息（新建对话）
    if (!params?.id) {
      // 创建新对话
      const newConversationId = createNewConversation();
      debug.log('创建新对话', newConversationId);

      // 保存useDeepThinking到localStorage,键名包含conversationId
      const storageKey = `pending_useDeepThinking_${newConversationId}`;
      localStorage.setItem(storageKey, JSON.stringify(useDeepThinking));
      debug.log('保存 useDeepThinking 到 localStorage', { key: storageKey, value: useDeepThinking });

      // 添加用户消息到localStorage
      addMessage(newConversationId, { role: "user", content: message, steps: [] });
      debug.log('已添加用户消息到localStorage');

      // 立即跳转到新对话页面（useEffect会自动检测并发送）
      const targetUrl = `/chat/${newConversationId}`;
      debug.log('立即跳转', targetUrl);
      router.push(targetUrl);

      return;
    }

    // 场景2：在 /chat/xxx 页面发送消息（现有对话）
    debug.log('使用现有对话', params.id);

    // 使用自定义SSE hook发送消息
    sendMessage(message, useDeepThinking);
  };

  // 判断是否为空对话
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {isEmpty ? (
        /* 新对话状态: 居中布局 */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-4 mt-[60px]">
            {/* 标题区域 */}
            <div className="relative text-center space-y-0 py-0 rounded-lg">
              {/* 背景图 */}
              <img
                src="/imgs/common/character.png"
                alt=""
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[250px] w-[350px] opacity-80 pointer-events-none"
              />

              {/* 渐变背景 */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 pointer-events-none -z-10" />

              {/* 内容 */}
              <div className="relative z-10">
                <h1 className="text-4xl font-bold">
                  {t("title_placeholder")}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            {/* 居中的输入框 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-[960px] mx-auto"
            >
              <EmptyChatInput
                onSend={handleSend}
                disabled={isLoading}
                value={input}
                onChange={(value) => handleInputChange({ target: { value } } as any)}
              />
            </motion.div>

            {/* 预设问题 - Tabs版本 */}
            <Tabs defaultValue="hot_topics" className="w-full  mx-auto">
              <TabsList className="w-full mb-4 bg-transparent p-0 h-auto border-b border-border">
                <TabsTrigger
                  value="hot_topics"
                  className="flex-1 rounded-none border-x-0 border-t-0 border-b-2 border-transparent data-[state=active]:!border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 font-medium"
                >
                  {t("preset_tabs.hot_topics")}
                </TabsTrigger>
                <TabsTrigger
                  value="market_news"
                  className="flex-1 rounded-none border-x-0 border-t-0 border-b-2 border-transparent data-[state=active]:!border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 font-medium"
                >
                  {t("preset_tabs.market_news")}
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: 热点话题 */}
              <TabsContent className="" value="hot_topics">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    t("preset_questions.analyze_crypto"),
                    t("preset_questions.crypto_news"),
                    t("preset_questions.defi_risk"),
                  ].map((prompt, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.1 + i * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      <div
                        className="w-full text-left h-auto py-2 px-3 md:py-4 md:px-5 text-sm transition-all hover:scale-[1.02] border border-border rounded-lg cursor-pointer hover:bg-accent"
                        onClick={() => {
                          if (!isLoading) {
                            handleInputChange({ target: { value: prompt } } as any);
                          }
                        }}
                      >
                        {prompt}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Tab 2: 市场快讯 */}
              <TabsContent className="" value="market_news">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      title: t("market_news.solana_ai_dex.title"),
                      time: t("market_news.solana_ai_dex.time"),
                    },
                    {
                      title: t("market_news.blackrock_btc_etp.title"),
                      time: t("market_news.blackrock_btc_etp.time"),
                    },
                    {
                      title: t("market_news.musk_floki_rally.title"),
                      time: t("market_news.musk_floki_rally.time"),
                    },
                  ].map((news, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.1 + i * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      <div
                        className="w-full text-left h-auto py-2 px-3 md:py-4 md:px-5 text-sm transition-all hover:scale-[1.02] border border-border rounded-lg cursor-pointer hover:bg-accent flex items-center gap-3"
                        onClick={() => {
                          if (!isLoading) {
                            handleInputChange({ target: { value: news.title } } as any);
                          }
                        }}
                      >
                        <span className="flex-1">{news.title}</span>
                        <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded shrink-0">
                          NEW
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        /* 聊天状态: 顶部标题 + 消息列表 + 底部输入框 */
        <>
          {/* 顶部标题栏 */}
          <div className="px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <h1 className="text-lg font-semibold">
              {currentConversation?.title || "Narra Agent"}
            </h1>
          </div>

          {/* 消息列表 - 使用StickToBottom实现智能滚动 */}
          <StickToBottom className="flex-1 overflow-y-auto overflow-x-hidden" resize="smooth" initial="smooth">
            <StickToBottom.Content className="flex flex-col gap-0 pb-32">
              {messages.map((msg: any, index: number) => {
                const persistedMessage = currentMessages.find(m => m.id === msg.id);
                const messageData = {
                  id: msg.id,
                  role: msg.role as "user" | "assistant",
                  content: msg.content || '',
                  steps: persistedMessage?.steps || msg.steps || [],
                  metadata: persistedMessage?.metadata || msg.metadata,
                  entities: persistedMessage?.entities || msg.entities || [],
                  timestamp: Date.now(),
                };

                const isLastMessage = index === messages.length - 1;
                const isGenerating = isLoading && isLastMessage && msg.role === "assistant";

                return <ChatMessage key={msg.id} message={messageData as any} isGenerating={isGenerating} />;
              })}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3 py-4 px-4 bg-muted/30">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                    AI
                  </div>
                  <div className="flex items-center gap-2">
                    <ReloadIcon className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">{t("thinking")}</span>
                  </div>
                </div>
              )}
            </StickToBottom.Content>
          </StickToBottom>

          {/* 浮动输入框 */}
          <ChatInput onSend={handleSend} disabled={isLoading} variant="floating" />
        </>
      )}
    </div>
  );
}
