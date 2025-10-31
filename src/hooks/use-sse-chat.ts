/**
 * 自定义SSE聊天hook - 使用 ChatEngine 处理 SSE 流
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type { Message } from '@/types/chat';
import { ChatEngine } from '@/lib/chat-engine';

export interface UseSSEChatOptions {
  id?: string;
  initialMessages?: Message[];
  apiUrl?: string;
  onFinish?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export interface UseSSEChatReturn {
  messages: Message[];
  sendMessage: (content: string, useDeepThinking?: boolean) => Promise<void>;
  status: 'idle' | 'submitted' | 'streaming' | 'error';
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentSteps: Message['steps'];
}

export function useSSEChat(options: UseSSEChatOptions = {}): UseSSEChatReturn {
  const {
    initialMessages = [],
    apiUrl = '/api/services/chat',
    onFinish,
    onError,
  } = options;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [status, setStatus] = useState<'idle' | 'submitted' | 'streaming' | 'error'>('idle');
  const engine = useMemo(() => new ChatEngine(), []);

  const sendMessage = useCallback(async (content: string, useDeepThinking = false) => {
    // 创建用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      steps: [],
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setStatus('submitted');

    // 创建 assistant 消息占位符
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      steps: [],
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStatus('streaming');

    try {
      await engine.sendMessage(
        content,
        (streamState) => {
          // 实时更新 assistant 消息
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: streamState.content,
                  steps: streamState.steps,
                  metadata: streamState.metadata,
                }
              : msg
          ));
        },
        apiUrl,
        useDeepThinking
      );

      setStatus('idle');

      if (onFinish) {
        const finalMessage = messages.find(m => m.id === assistantMessageId);
        if (finalMessage) {
          onFinish(finalMessage);
        }
      }

    } catch (error) {
      setStatus('error');

      if (onError) {
        onError(error as Error);
      }

      // 移除 assistant 占位符消息
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    }
  }, [apiUrl, engine, messages, onFinish, onError]);

  // 获取当前最后一条 assistant 消息的 steps（用于兼容性）
  const currentSteps = messages.length > 0 && messages[messages.length - 1].role === 'assistant'
    ? messages[messages.length - 1].steps
    : [];

  return {
    messages,
    sendMessage,
    status,
    setMessages,
    currentSteps,
  };
}
