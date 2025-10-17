"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useChatContext } from "./chat-context";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

export function ChatConversation() {
  const t = useTranslations("chat");
  const { currentMessages, addMessage, updateMessage, updateMessageReasoning, isLoading, setIsLoading, conversations, currentConversationId, createNewConversation, setGeneratingMessageId } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(""); // 控制输入框的值

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const handleSend = async (message: string, useDeepThinking: boolean) => {
    setError(null);
    setIsLoading(true);
    setInputValue(""); // 清空输入框

    // 如果当前没有对话，先创建新对话
    let targetConversationId = currentConversationId;
    if (!targetConversationId) {
      targetConversationId = createNewConversation();
    }

    // 添加用户消息（指定对话ID，避免状态更新延迟问题）
    addMessage({ role: "user", content: message }, targetConversationId);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          useDeepThinking,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let accumulatedReasoning = ""; // 累积思考过程

      if (!reader) {
        throw new Error("No response body");
      }

      // 创建一个AI消息并获取其ID
      const assistantMessageId = addMessage({ role: "assistant", content: "" });
      setGeneratingMessageId(assistantMessageId);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // 处理不同类型的事件
              if (parsed.event === "reasoning" && parsed.data?.message) {
                // 累积思考过程
                const reasoningContent = parsed.data.message;
                accumulatedReasoning += reasoningContent + "\n";

                // 实时更新思考过程
                updateMessageReasoning(assistantMessageId, accumulatedReasoning);
              } else if (parsed.event === "report_chunk" && parsed.data?.content) {
                // 累积报告内容
                const content = parsed.data.content.trim();

                if (content.length > 0) {
                  accumulatedContent += content;

                  // 实时更新同一个AI消息
                  updateMessage(assistantMessageId, accumulatedContent);
                }
              } else if (parsed.event === "complete" && parsed.data?.final_report) {
                // 最终报告,替换所有累积内容
                accumulatedContent = parsed.data.final_report;

                updateMessage(assistantMessageId, accumulatedContent);
              }
            } catch (e) {
              // 忽略JSON解析错误
              console.warn("Failed to parse SSE data:", data);
            }
          }
        }
      }

      // 如果没有累积内容，更新为错误消息
      if (!accumulatedContent) {
        updateMessage(assistantMessageId, t("error_no_response"));
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(t("error_send_failed"));
      addMessage({
        role: "assistant",
        content: t("error_generic"),
      });
    } finally {
      setIsLoading(false);
      setGeneratingMessageId(null);
    }
  };

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

          {/* 错误提示 */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
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
