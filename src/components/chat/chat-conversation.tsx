"use client";

import { useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useChat } from "ai/react";
import { useChatContext, getPathPrefix } from "./chat-context";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { ReasoningPanel } from "./reasoning-panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function ChatConversation() {
  const t = useTranslations("chat");
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const {
    currentMessages,
    conversations,
    currentConversationId,
    createNewConversation,
    syncConversationFromUseChat,
    addMessage,
  } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSentRef = useRef<Set<string>>(new Set()); // 记录已自动发送的对话ID
  const prevConversationIdRef = useRef<string | null>(null); // 跟踪上一次的conversationId

  // 使用 useChat hook 管理聊天状态
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    data,
    setMessages,
    append,
  } = useChat({
    api: "/api/chat",
    id: (params?.id as string) || undefined, // 多对话支持
    body: {
      useDeepThinking: true, // 默认启用深度思考
    },
    onFinish: (message) => {
      console.log("[ChatConversation] AI响应完成:", message);
      // 注意: 实际的 steps 保存逻辑在 useEffect 中处理(监听 isLoading 变化)
      // 这里不需要做任何事情,因为 onFinish 时 data 可能还没更新
    },
    onError: (error) => {
      console.error("[ChatConversation] useChat错误:", error);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 调试日志：监控messages数组变化
  const prevMessagesRef = useRef<typeof messages>([]);
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const prevLastMessage = prevMessagesRef.current[prevMessagesRef.current.length - 1];

      if (lastMessage?.role === "assistant") {
        const contentChanged = lastMessage.content !== prevLastMessage?.content;
        if (contentChanged) {
          console.log(`[ChatConversation] 📝 Messages数组更新 - assistant消息内容变化`, {
            totalMessages: messages.length,
            lastMessageId: lastMessage.id,
            contentLength: lastMessage.content.length,
            isLoading: isLoading
          });
        }
      }
    }

    prevMessagesRef.current = messages;
  }, [messages, isLoading]);

  // 监听 messages 变化,当AI消息完成时保存 steps 到 localStorage
  const prevMessagesLengthRef = useRef(messages.length);
  const hasProcessedMessageRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log("[ChatConversation] 💾 Save steps useEffect triggered", {
      messagesLength: messages.length,
      prevLength: prevMessagesLengthRef.current,
      isLoading,
      dataLength: Array.isArray(data) ? data.length : 0,
      hasNewMessage: messages.length > prevMessagesLengthRef.current
    });

    // 检测到新消息且不在loading状态
    if (messages.length > prevMessagesLengthRef.current && !isLoading) {
      const lastMessage = messages[messages.length - 1];

      console.log("[ChatConversation] ✅ Condition met - new message when not loading", {
        messageId: lastMessage.id,
        role: lastMessage.role,
        alreadyProcessed: hasProcessedMessageRef.current.has(lastMessage.id)
      });

      // 只处理assistant消息,且没有处理过
      if (lastMessage.role === "assistant" && !hasProcessedMessageRef.current.has(lastMessage.id)) {
        console.log("[ChatConversation] 检测到新的AI消息,准备保存 steps");

        // 标记为已处理
        hasProcessedMessageRef.current.add(lastMessage.id);

        // 提取最新的 steps 和 metadata
        const latestData = Array.isArray(data) && data.length > 0 ? data[data.length - 1] : null;
        const finalSteps = (latestData as any)?.steps || [];
        const finalMetadata = (latestData as any)?.metadata || null;

        console.log("[ChatConversation] 最终提取的 steps 数量:", finalSteps.length);
        console.log("[ChatConversation] 最终提取的 metadata:", finalMetadata);

        // 如果有 steps 或 metadata,保存到 localStorage
        if (params?.id && (finalSteps.length > 0 || finalMetadata)) {
          console.log("[ChatConversation] 同步最终数据到 localStorage");

          // 创建带有完整 data 的消息对象
          const messageWithData = {
            ...lastMessage,
            data: {
              steps: finalSteps,
              metadata: finalMetadata,
            }
          };

          syncConversationFromUseChat(
            params.id as string,
            [...messages.slice(0, -1), messageWithData],
            data
          );
        }

        // ✅ 只有在成功处理assistant消息后才更新ref
        prevMessagesLengthRef.current = messages.length;
        console.log("[ChatConversation] ✅ Updated prevMessagesLengthRef after processing assistant message");
      } else if (lastMessage.role === "user") {
        // 如果是用户消息，也更新ref，避免重复检查
        prevMessagesLengthRef.current = messages.length;
        console.log("[ChatConversation] ℹ️ Updated prevMessagesLengthRef after user message");
      }
    }
  }, [messages, isLoading, data, params?.id, syncConversationFromUseChat]);

  // 当切换对话时,同步localStorage消息到useChat
  useEffect(() => {
    const conversationId = params?.id as string;

    // 检查conversationId是否变化（排除初始加载的情况，prevConversationIdRef为null时必须执行同步）
    if (prevConversationIdRef.current === conversationId && prevConversationIdRef.current !== null) {
      console.log("[ChatConversation] conversationId未变化,跳过同步");
      return;
    }

    if (conversationId) {
      // 如果currentMessages为空,说明对话数据还没有加载,等待下次currentMessages更新后再次触发
      // 注意:不要在这里更新ref,否则下次currentMessages更新时会被跳过
      if (currentMessages.length === 0) {
        console.log("[ChatConversation] conversationId存在但currentMessages为空,等待数据加载");
        return;
      }

      console.log("[ChatConversation] conversationId变化,同步localStorage到useChat:", currentMessages.length, "条消息");

      // 检查是否需要自动发送（新对话且只有1条用户消息）
      const hasOnlyOneUserMessage = currentMessages.length === 1 && currentMessages[0].role === "user";
      const notSentYet = !hasAutoSentRef.current.has(conversationId);

      console.log("[ChatConversation] 自动发送检查:", {
        hasOnlyOneUserMessage,
        notSentYet,
        conversationId,
        isLoading
      });

      if (hasOnlyOneUserMessage && notSentYet) {
        console.log("[ChatConversation] 满足条件，准备自动发送消息");

        // 标记为已发送
        hasAutoSentRef.current.add(conversationId);

        const messageToSend = currentMessages[0].content;

        // 直接append发送,不需要先setMessages
        console.log("[ChatConversation] 调用append发送:", messageToSend.slice(0, 30));
        append({
          role: "user",
          content: messageToSend,
        });
      } else {
        // 非新对话,同步localStorage消息到useChat
        console.log("[ChatConversation] 同步localStorage到useChat (切换对话)");
        const useChatMessages = currentMessages.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          createdAt: new Date(msg.timestamp),
          data: {
            steps: msg.steps,
            metadata: msg.metadata,
          },
        }));
        setMessages(useChatMessages as any);
      }

      // 成功同步后更新ref
      prevConversationIdRef.current = conversationId;
    } else {
      // 在 /chat 页面,清空消息
      console.log("[ChatConversation] 清空消息 (回到/chat页面)");
      setMessages([]);

      // 更新ref
      prevConversationIdRef.current = null;
    }
  }, [params?.id, currentConversationId, currentMessages, setMessages, append, isLoading]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const handleSend = async (message: string, _useDeepThinking: boolean) => {
    console.log("[ChatConversation] 开始发送消息:", message.slice(0, 50));

    // 场景1：在 /chat 页面发送消息（新建对话）
    if (!params?.id) {
      // 创建新对话
      const newConversationId = createNewConversation();
      console.log("[ChatConversation] 创建新对话:", newConversationId);

      // 添加用户消息到localStorage
      addMessage({ role: "user", content: message }, newConversationId);
      console.log("[ChatConversation] 已添加用户消息到localStorage");

      // 立即跳转到新对话页面（useEffect会自动检测并发送）
      const pathPrefix = getPathPrefix(locale);
      const targetUrl = `${pathPrefix}/chat/${newConversationId}`;
      console.log("[ChatConversation] 立即跳转:", targetUrl);
      router.push(targetUrl);

      return;
    }

    // 场景2：在 /chat/xxx 页面发送消息（现有对话）
    console.log("[ChatConversation] 使用现有对话:", params.id);

    // 使用useChat的append发送消息
    append({
      role: "user",
      content: message,
    });
  };

  // 判断是否为空对话
  const isEmpty = messages.length === 0;

  // 提取当前steps (从data annotations)
  // data是AI SDK返回的data数组,最新的annotation在最后一个
  const latestData = Array.isArray(data) && data.length > 0 ? data[data.length - 1] : null;
  const currentSteps = (latestData as any)?.steps || [];
  const generatingMessageId = messages[messages.length - 1]?.id;

  // 调试日志
  if (isLoading && currentSteps.length > 0) {
    console.log("[ChatConversation] 实时推理步骤:", currentSteps.length, "steps");
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {isEmpty ? (
        /* 新对话状态: 居中布局 */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-8">
            {/* 标题区域 */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold">
                {t("title_placeholder")}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t("subtitle")}
              </p>
            </div>

            {/* 居中的输入框 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ChatInput
                onSend={handleSend}
                disabled={isLoading}
                variant="centered"
                value={input}
                onChange={(value) => handleInputChange({ target: { value } } as any)}
              />
            </motion.div>

            {/* 预设问题 - Tabs版本 */}
            <Tabs defaultValue="hot_topics" className="w-full">
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
              <TabsContent value="hot_topics">
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
                      <Button
                        variant="outline"
                        className="w-full text-left justify-start h-auto py-4 px-5 text-base transition-all hover:scale-[1.02]"
                        onClick={() => {
                          if (!isLoading) {
                            handleInputChange({ target: { value: prompt } } as any);
                          }
                        }}
                      >
                        {prompt}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Tab 2: 市场快讯 */}
              <TabsContent value="market_news">
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
                      <Button
                        variant="outline"
                        className="w-full text-left justify-between h-auto py-4 px-5 text-base transition-all hover:scale-[1.02] flex items-center gap-3"
                        onClick={() => {
                          if (!isLoading) {
                            handleInputChange({ target: { value: news.title } } as any);
                          }
                        }}
                      >
                        <span className="flex-1">{news.title}</span>
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded shrink-0">
                          {news.time}
                        </span>
                      </Button>
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

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto pb-32">
            {messages.map((msg, index) => {
              // 将useChat的Message转换为ChatMessage组件的格式
              const messageData = {
                id: msg.id,
                role: msg.role as "user" | "assistant",
                content: msg.content,
                steps: (msg as any).data?.steps,
                metadata: (msg as any).data?.metadata,
                timestamp: msg.createdAt?.getTime() || Date.now(),
              };

              // 判断是否正在生成：最后一条assistant消息 + isLoading=true
              const isLastMessage = index === messages.length - 1;
              const isGenerating = isLoading && isLastMessage && msg.role === "assistant";

              return <ChatMessage key={msg.id} message={messageData as any} isGenerating={isGenerating} />;
            })}

            {/* 正在生成的消息 - 显示实时推理面板 */}
            {isLoading && generatingMessageId && currentSteps.length > 0 && (
              <div className="py-6 px-4 md:px-6 bg-muted/30">
                <div className="w-full">
                  <ReasoningPanel
                    message={{
                      id: generatingMessageId,
                      role: "assistant",
                      content: "",
                      steps: currentSteps,
                      timestamp: Date.now()
                    } as any}
                    isGenerating={true}
                  />
                </div>
              </div>
            )}

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
            <div ref={messagesEndRef} />
          </div>

          {/* 浮动输入框 */}
          <ChatInput onSend={handleSend} disabled={isLoading} variant="floating" />
        </>
      )}
    </div>
  );
}
