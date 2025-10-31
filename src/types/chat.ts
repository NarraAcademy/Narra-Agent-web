/**
 * 聊天系统统一类型定义
 *
 * 设计原则：
 * 1. 单一真相源 (Single Source of Truth)
 * 2. 必填优于可选
 * 3. 时间戳统一使用 number (Date.now())
 * 4. 清晰无歧义的命名
 */

import type { Entity } from './entity';

/**
 * 聊天消息
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps: Step[];
  metadata?: MessageMetadata;
  entities?: Entity[];
  createdAt: number;
}

/**
 * 工作流步骤
 */
export interface Step {
  id: string;
  title: string;
  agent?: string;
  status: 'running' | 'completed' | 'failed';
  items: StepItem[];
  timestamp?: string;
}

/**
 * 步骤项元数据
 */
export interface StepItemMetadata {
  url?: string;
  title?: string;
  description?: string;
  result?: string;
  error?: string;
  duration?: number;
  [key: string]: string | number | boolean | undefined;
}

/**
 * 步骤中的推理项
 */
export interface StepItem {
  id: string;
  content: string;
  agent: string;
  category?: 'search' | 'browse' | 'analyze' | 'tool_call' | 'status' | 'info';
  metadata?: StepItemMetadata;
  timestamp?: string;
}

/**
 * 消息元数据
 */
export interface MessageMetadata {
  tools_used?: string[];
  agents_used?: string[];
}

/**
 * 对话
 */
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

/**
 * SSE 流状态
 */
export interface StreamState {
  status: 'idle' | 'streaming' | 'completed' | 'error';
  content: string;
  steps: Step[];
  error?: Error;
}

/**
 * SSE 事件类型
 */
export type SSEEventType = 'start' | 'step' | 'reasoning' | 'result' | 'complete' | 'error' | 'done';

/**
 * SSE 事件数据
 */
export interface SSEEventData {
  step_id?: string;
  title?: string;
  agent?: string;
  content?: string;
  category?: StepItem['category'];
  metadata?: StepItemMetadata;
  timestamp?: string;
  tools_used?: string[];
  agents_used?: string[];
}

/**
 * SSE 事件
 */
export interface SSEEvent {
  event: SSEEventType;
  data?: SSEEventData;
  error?: string;
}
