/**
 * Debug工具 - 仅在开发环境输出日志
 * 生产环境自动禁用所有调试日志
 */

const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'warn' | 'error' | 'info';

/**
 * 条件化日志输出
 * @param level 日志级别
 * @param namespace 命名空间(组件名)
 * @param message 消息
 * @param data 可选数据
 */
function debugLog(
  level: LogLevel,
  namespace: string,
  message: string,
  data?: any
) {
  if (!isDev) return;

  const emoji = {
    log: '📝',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  }[level];

  const timestamp = new Date().toISOString().split('T')[1];
  const prefix = `[${namespace}] ${emoji} ⏰${timestamp}`;

  if (data !== undefined) {
    console[level](`${prefix} ${message}`, data);
  } else {
    console[level](`${prefix} ${message}`);
  }
}

/**
 * Debug工具类 - 为每个组件创建专属debug实例
 */
export class Debug {
  constructor(private namespace: string) {}

  log(message: string, data?: any) {
    debugLog('log', this.namespace, message, data);
  }

  info(message: string, data?: any) {
    debugLog('info', this.namespace, message, data);
  }

  warn(message: string, data?: any) {
    debugLog('warn', this.namespace, message, data);
  }

  error(message: string, data?: any) {
    debugLog('error', this.namespace, message, data);
  }
}

/**
 * 创建命名空间的debug实例
 * @param namespace 组件/模块名称
 * @example
 * const debug = createDebug('ChatMessage');
 * debug.log('渲染状态', { count: 10 });
 */
export function createDebug(namespace: string): Debug {
  return new Debug(namespace);
}
