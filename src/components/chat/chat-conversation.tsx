"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useChatContext, WorkflowStep, ReasoningStep, getPathPrefix } from "./chat-context";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { ReasoningPanel } from "./reasoning-panel";

export function ChatConversation() {
  const t = useTranslations("chat");
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const {
    currentMessages,
    addMessage,
    updateMessage,
    updateMessageSteps,
    updateMessageMetadata,
    isLoading,
    setIsLoading,
    conversations,
    currentConversationId,
    createNewConversation,
    generatingMessageId,
    setGeneratingMessageId
  } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(""); // 控制输入框的值
  const [statusMessage, setStatusMessage] = useState<string>(""); // 状态消息
  const [currentSteps, setCurrentSteps] = useState<Map<string, WorkflowStep>>(new Map()); // 当前工作流步骤

  // 用于记录已处理的用户消息，避免重复触发 AI 响应
  const processedUserMessageRef = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  // 提取的 AI 响应请求函数
  const fetchAIResponse = async (
    userMessage: string,
    targetConversationId: string,
    useDeepThinking: boolean
  ) => {
    setError(null);
    setIsLoading(true);
    setStatusMessage("");
    setCurrentSteps(new Map());

    let assistantMessageId: string | null = null;
    let accumulatedContent = "";
    let buffer = "";

    try {
      console.log("[ChatConversation] 发起API请求");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          useDeepThinking,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      // 创建AI消息
      assistantMessageId = addMessage({ role: "assistant", content: "" }, targetConversationId);
      setGeneratingMessageId(assistantMessageId);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[ChatConversation] SSE流读取完成");
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log("[ChatConversation] 接收到chunk:", chunk.slice(0, 100));
        buffer += chunk;

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            console.log("[ChatConversation] 解析SSE数据:", data.slice(0, 100));

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              console.log("[ChatConversation] SSE事件类型:", parsed.event);

              switch (parsed.event) {
                case "start":
                  setStatusMessage(parsed.message || "开始处理...");
                  break;

                case "step":
                  if (parsed.data) {
                    const newStep: WorkflowStep = {
                      id: parsed.data.step_id || `step-${Date.now()}`,
                      title: parsed.data.title || "处理步骤",
                      agent: parsed.data.agent,
                      status: "running",
                      reasoning: [],
                      timestamp: parsed.data.timestamp,
                    };
                    setCurrentSteps((prev) => {
                      const updated = new Map(prev);
                      updated.set(newStep.id, newStep);
                      return updated;
                    });
                  }
                  break;

                case "reasoning":
                  if (parsed.data) {
                    const reasoningItem: ReasoningStep = {
                      id: `reasoning-${Date.now()}-${Math.random()}`,
                      content: parsed.data.content || "",
                      agent: parsed.data.agent || "System",
                      category: parsed.data.category || "info",
                      metadata: parsed.data.metadata,
                      step_id: parsed.data.step_id,
                      timestamp: parsed.data.timestamp || new Date().toISOString(),
                    };

                    const stepId = reasoningItem.step_id || "default-step";

                    setCurrentSteps((prev) => {
                      const updated = new Map(prev);
                      let targetStep = updated.get(stepId);

                      if (!targetStep) {
                        targetStep = {
                          id: stepId,
                          title: stepId === "default-step" ? "其他推理" : `步骤 ${stepId}`,
                          status: "running",
                          reasoning: [],
                        };
                        updated.set(stepId, targetStep);
                      }

                      targetStep.reasoning.push(reasoningItem);
                      updated.set(stepId, { ...targetStep });

                      return updated;
                    });
                  }
                  break;

                case "status":
                  if (parsed.data && parsed.data.message) {
                    setStatusMessage(parsed.data.message);
                  }
                  break;

                case "result":
                  if (parsed.data && parsed.data.content) {
                    accumulatedContent += parsed.data.content;
                    updateMessage(assistantMessageId, accumulatedContent, targetConversationId);
                  }
                  break;

                case "complete":
                  setStatusMessage("完成");

                  // 使用final_report或累积内容
                  const finalContent = parsed.data?.final_report || accumulatedContent;
                  if (finalContent && assistantMessageId) {
                    updateMessage(assistantMessageId, finalContent, targetConversationId);
                  }

                  if (parsed.data) {
                    updateMessageMetadata(assistantMessageId, {
                      tools_used: parsed.data.tools_used,
                      agents_used: parsed.data.agents_used,
                    }, targetConversationId);
                  }
                  break;

                case "error":
                  setError(parsed.error || "未知错误");
                  break;

                case "done":
                  console.log("SSE stream ended");
                  break;

                default:
                  console.warn("Unknown event type:", parsed.event);
              }
            } catch (e) {
              console.warn("Failed to parse SSE data:", data, e);
            }
          }
        }
      }

      if (!accumulatedContent) {
        updateMessage(assistantMessageId, t("error_no_response"), targetConversationId);
      }
    } catch (err) {
      console.error("[ChatConversation] API错误:", err);
      setError(t("error_send_failed"));
      addMessage({
        role: "assistant",
        content: t("error_generic"),
      }, targetConversationId);
    } finally {
      // 确保显示完整内容
      if (accumulatedContent && assistantMessageId) {
        updateMessage(assistantMessageId, accumulatedContent, targetConversationId);
      }

      // 保存工作流步骤
      setCurrentSteps((prevSteps) => {
        const finalSteps = Array.from(prevSteps.values());
        if (finalSteps.length > 0 && assistantMessageId) {
          const messageId = assistantMessageId; // 捕获值以解决TypeScript类型问题
          setTimeout(() => {
            updateMessageSteps(messageId, finalSteps, targetConversationId);
          }, 0);
        }
        return new Map();
      });

      setIsLoading(false);
      setGeneratingMessageId(null);
      setStatusMessage("");
    }
  };

  const handleSend = async (message: string, useDeepThinking: boolean) => {
    console.log("[ChatConversation] 开始发送消息:", message.slice(0, 50));

    setInputValue(""); // 清空输入框

    // 场景1：在 /chat 页面发送消息（新建对话）
    if (!params?.id) {
      // 创建新对话
      const newConversationId = createNewConversation();
      console.log("[ChatConversation] 创建新对话:", newConversationId);

      // 添加用户消息
      addMessage({ role: "user", content: message }, newConversationId);
      console.log("[ChatConversation] 已添加用户消息到对话:", newConversationId);

      // 立即跳转到新对话页面（不等待API）
      const pathPrefix = getPathPrefix(locale);
      const targetUrl = `${pathPrefix}/chat/${newConversationId}`;
      console.log("[ChatConversation] 立即跳转:", targetUrl);
      router.push(targetUrl);

      // useEffect 会自动检测并发起 AI 请求
      return;
    }

    // 场景2：在 /chat/xxx 页面发送消息（现有对话）
    console.log("[ChatConversation] 使用现有对话:", params.id);

    // 添加用户消息
    addMessage({ role: "user", content: message }, params.id as string);
    console.log("[ChatConversation] 已添加用户消息到对话:", params.id);

    // 立即发起 AI 请求
    await fetchAIResponse(message, params.id as string, useDeepThinking);
  };

  // 自动触发 AI 响应的 useEffect
  // 当检测到对话中有未回复的用户消息时，自动发起 AI 请求
  useEffect(() => {
    // 只在对话页面才自动触发
    if (!params?.id) return;

    // 检查是否有消息
    if (currentMessages.length === 0) return;

    // 检查最后一条消息
    const lastMessage = currentMessages[currentMessages.length - 1];

    // 只有当最后一条是用户消息时才触发
    if (lastMessage.role !== 'user') return;

    // 如果正在加载或生成中，不触发
    if (isLoading || generatingMessageId) return;

    // 如果这条消息已经处理过，不触发
    if (processedUserMessageRef.current.has(lastMessage.id)) return;

    // 标记为已处理
    processedUserMessageRef.current.add(lastMessage.id);

    console.log("[ChatConversation] 自动触发 AI 响应，消息ID:", lastMessage.id);

    // 发起 AI 请求（默认不使用深度思考）
    fetchAIResponse(lastMessage.content, params.id as string, false);
  }, [params?.id, currentMessages, isLoading, generatingMessageId]);

  // 判断是否为空对话
  const isEmpty = currentMessages.length === 0;

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
                value={inputValue}
                onChange={setInputValue}
              />
            </motion.div>

            {/* 预设问题 */}
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
                    onClick={() => !isLoading && setInputValue(prompt)}
                  >
                    {prompt}
                  </Button>
                </motion.div>
              ))}
            </div>
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
            {currentMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* 正在生成的消息 - 单独渲染实时推理面板 */}
            {isLoading && generatingMessageId && currentSteps.size > 0 && (
              <div className="py-6 px-4 md:px-6 bg-muted/30">
                <div className="w-full">
                  <ReasoningPanel
                    message={{
                      id: generatingMessageId,
                      role: "assistant",
                      content: "",
                      steps: Array.from(currentSteps.values()),
                      timestamp: Date.now()
                    } as any}
                    isGenerating={true}
                  />
                </div>
              </div>
            )}

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

          {/* 状态栏 - 显示实时状态消息 */}
          {isLoading && statusMessage && (
            <div className="px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm border-t border-blue-500/20">
              <div className="flex items-center gap-2">
                <ReloadIcon className="w-4 h-4 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t border-destructive/20">
              {error}
            </div>
          )}

          {/* 浮动输入框 */}
          <ChatInput onSend={handleSend} disabled={isLoading} variant="floating" />
        </>
      )}
    </div>
  );
}
