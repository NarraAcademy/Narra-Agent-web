import type { Step, StepItem, MessageMetadata, SSEEvent } from '@/types/chat';

export interface StreamState {
  status: 'idle' | 'streaming' | 'completed' | 'error';
  content: string;
  steps: Step[];
  metadata?: MessageMetadata;
  error?: Error;
}

export class ChatEngine {
  private abortController: AbortController | null = null;

  async sendMessage(
    content: string,
    onUpdate: (state: StreamState) => void,
    apiUrl: string = '/api/services/chat',
    useDeepThinking: boolean = false
  ): Promise<void> {
    this.abortController = new AbortController();

    const state: StreamState = {
      status: 'streaming',
      content: '',
      steps: [],
    };

    try {
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
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      await this.processStream(response.body, state, onUpdate);

      state.status = 'completed';
      onUpdate({ ...state });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        state.status = 'idle';
      } else {
        state.status = 'error';
        state.error = error as Error;
      }
      onUpdate({ ...state });
      throw error;
    }
  }

  private async processStream(
    body: ReadableStream<Uint8Array>,
    state: StreamState,
    onUpdate: (state: StreamState) => void
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
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
            this.handleSSEEvent(parsed, state);
            onUpdate({ ...state });
          } catch {
            // 忽略无效的 JSON
          }
        }
      }
    }
  }

  private handleSSEEvent(event: SSEEvent, state: StreamState): void {
    switch (event.event) {
      case 'start':
        break;

      case 'step':
        if (event.data) {
          const newStep: Step = {
            id: event.data.step_id || `step-${Date.now()}`,
            title: event.data.title || '处理步骤',
            agent: event.data.agent,
            status: 'running',
            items: [],
            timestamp: event.data.timestamp,
          };
          state.steps.push(newStep);
        }
        break;

      case 'reasoning':
        if (event.data) {
          const stepId = event.data.step_id || 'default-step';
          const targetStep = state.steps.find(s => s.id === stepId);

          const newItem: StepItem = {
            id: `item-${Date.now()}-${Math.random()}`,
            content: event.data.content || '',
            agent: event.data.agent || 'System',
            category: event.data.category || 'info',
            metadata: event.data.metadata,
            timestamp: event.data.timestamp,
          };

          if (targetStep) {
            targetStep.items.push(newItem);
            targetStep.status = 'running';
          } else {
            // 创建默认step
            const newStep: Step = {
              id: stepId,
              title: '其他推理',
              status: 'running',
              items: [newItem],
            };
            state.steps.push(newStep);
          }
        }
        break;

      case 'result':
        if (event.data && event.data.content) {
          state.content += event.data.content;
        }
        break;

      case 'complete':
        if (event.data) {
          state.metadata = {
            tools_used: event.data.tools_used,
            agents_used: event.data.agents_used,
          };

          // 标记所有steps为completed
          state.steps.forEach(step => {
            if (step.status === 'running') {
              step.status = 'completed';
            }
          });
        }
        break;

      case 'error':
        state.error = new Error(event.error || '未知错误');
        break;

      case 'done':
        break;

      default:
        break;
    }
  }

  abort(): void {
    this.abortController?.abort();
  }
}
