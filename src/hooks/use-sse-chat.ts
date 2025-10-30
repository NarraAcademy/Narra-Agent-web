/**
 * 自定义SSE聊天hook - 直接处理后端SSE流,完全绕过AI SDK
 */

import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: WorkflowStep[];
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export interface WorkflowStep {
  id: string;
  title: string;
  agent?: string;
  status: 'running' | 'completed' | 'failed';
  reasoning: ReasoningItem[];
  timestamp?: string;
}

export interface ReasoningItem {
  id: string;
  content: string;
  agent: string;
  category: string;
  metadata?: Record<string, any>;
  step_id?: string;
  timestamp?: string;
}

export interface UseSSEChatOptions {
  id?: string;
  initialMessages?: ChatMessage[];
  apiUrl?: string;
  onFinish?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
}

export interface UseSSEChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string, useDeepThinking?: boolean) => Promise<void>;
  status: 'idle' | 'submitted' | 'streaming' | 'error';
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentSteps: WorkflowStep[];
}

export function useSSEChat(options: UseSSEChatOptions = {}): UseSSEChatReturn {
  const {
    id,
    initialMessages = [],
    apiUrl = '/api/services/chat',
    onFinish,
    onError,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<'idle' | 'submitted' | 'streaming' | 'error'>('idle');
  const [currentSteps, setCurrentSteps] = useState<WorkflowStep[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, useDeepThinking = false) => {
    // 创建用户消息
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date(),
    };

    // 添加用户消息到列表
    setMessages(prev => [...prev, userMessage]);
    setStatus('submitted');

    // 准备assistant消息占位符
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      steps: [],
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    // 创建abort controller
    abortControllerRef.current = new AbortController();

    try {
      // 通过中间层API调用后端SSE接口
      console.log('[useSSEChat] 开始请求API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          message: content,
          useDeepThinking,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      setStatus('streaming');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      const steps: WorkflowStep[] = [];
      let metadata: Record<string, any> = {};

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[useSSEChat] SSE流读取完成');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 按行分割
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              console.log('[useSSEChat] 收到事件:', parsed.event);

              switch (parsed.event) {
                case 'start':
                  console.log('[useSSEChat] 流开始');
                  break;

                case 'step':
                  if (parsed.data) {
                    const newStep: WorkflowStep = {
                      id: parsed.data.step_id || `step-${Date.now()}`,
                      title: parsed.data.title || '处理步骤',
                      agent: parsed.data.agent,
                      status: 'running',
                      reasoning: [],
                      timestamp: parsed.data.timestamp,
                    };
                    steps.push(newStep);
                    setCurrentSteps([...steps]);
                    console.log('[useSSEChat] 新增step:', newStep.title);
                  }
                  break;

                case 'reasoning':
                  if (parsed.data) {
                    const stepId = parsed.data.step_id || 'default-step';
                    const targetStep = steps.find(s => s.id === stepId);

                    const newReasoning: ReasoningItem = {
                      id: `reasoning-${Date.now()}-${Math.random()}`,
                      content: parsed.data.content || '',
                      agent: parsed.data.agent || 'System',
                      category: parsed.data.category || 'info',
                      metadata: parsed.data.metadata,
                      step_id: parsed.data.step_id,
                      timestamp: parsed.data.timestamp,
                    };

                    if (targetStep) {
                      targetStep.reasoning.push(newReasoning);
                      targetStep.status = 'running';
                    } else {
                      // 创建默认step
                      const newStep: WorkflowStep = {
                        id: stepId,
                        title: '其他推理',
                        status: 'running',
                        reasoning: [newReasoning],
                      };
                      steps.push(newStep);
                    }

                    setCurrentSteps([...steps]);
                    console.log('[useSSEChat] 新增reasoning:', newReasoning.content.substring(0, 50));
                  }
                  break;

                case 'result':
                  if (parsed.data && parsed.data.content) {
                    accumulatedContent += parsed.data.content;

                    // 实时更新assistant消息内容
                    setMessages(prev => prev.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent, steps: [...steps] }
                        : msg
                    ));

                    console.log('[useSSEChat] 收到result chunk:', parsed.data.content.substring(0, 30));
                  }
                  break;

                case 'complete':
                  if (parsed.data) {
                    metadata = {
                      tools_used: parsed.data.tools_used,
                      agents_used: parsed.data.agents_used,
                    };

                    // 标记所有steps为completed
                    steps.forEach(step => {
                      if (step.status === 'running') {
                        step.status = 'completed';
                      }
                    });

                    setCurrentSteps([...steps]);
                    console.log('[useSSEChat] 流完成,metadata:', metadata);
                  }
                  break;

                case 'error':
                  console.error('[useSSEChat] 后端错误:', parsed.error);
                  if (onError) {
                    onError(new Error(parsed.error || '未知错误'));
                  }
                  break;

                case 'done':
                  console.log('[useSSEChat] SSE流结束');
                  break;

                default:
                  console.warn('[useSSEChat] 未知事件类型:', parsed.event);
              }
            } catch (e) {
              console.warn('[useSSEChat] 解析SSE数据失败:', data, e);
            }
          }
        }
      }

      // 更新最终的assistant消息
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: accumulatedContent, steps: [...steps], metadata }
          : msg
      ));

      setStatus('idle');

      if (onFinish) {
        onFinish({ ...assistantMessage, content: accumulatedContent, steps, metadata });
      }

    } catch (error) {
      console.error('[useSSEChat] 错误:', error);
      setStatus('error');

      if (onError) {
        onError(error as Error);
      }

      // 移除assistant占位符消息
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    }
  }, [apiUrl, onFinish, onError]);

  return {
    messages,
    sendMessage,
    status,
    setMessages,
    currentSteps,
  };
}
