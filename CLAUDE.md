# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目信息

Narra Agent - AI 加密货币投资助手
- Next.js 15 + React 19 + TypeScript 5
- 核心功能：实时市场分析、AI 聊天对话

## 开发命令

```bash
pnpm dev              # 启动开发服务器
PORT=3000 pnpm dev    # 指定端口启动
pnpm build            # 生产构建
pnpm lint             # 代码检查

# 数据库
pnpm db:generate      # 生成迁移
pnpm db:migrate       # 执行迁移
pnpm db:studio        # 打开管理界面
```

## 路由结构

使用 Next.js 路由组实现布局隔离：
- `(default)/`: 带 Header+Footer 的营销页面
- `(chat)/`: 纯净聊天界面，无 Header/Footer
- `(admin)/`: 管理后台
- `(console)/`: 用户控制台

**关键**：根布局 `[locale]/layout.tsx` 仅提供 Provider，不包含 UI 组件

## Chatbot 核心流程

### 消息流转

1. `/chat` 页面发送 → 创建对话 → 跳转 `/chat/[id]`
2. `useSSEChat.sendMessage()` → POST `/api/services/chat`
3. SSE 流事件：
   - `step`: 工作流步骤
   - `reasoning`: 推理过程
   - `result`: 内容块
   - `complete`: 完成标记
4. 实时渲染：
   - `WorkflowStepCard`: 卡片显示推理步骤
   - `TypeWriterMarkdown`: 打字机效果渲染报告
5. Tab 切换：
   - 同时有 steps + content 时显示双 Tab
   - 生成中自动切换到"研究结果"
   - 历史消息默认"研究结果"

### 数据持久化

- 存储键：`narra-agent-conversations`
- 格式：`{ conversations: [{ id, title, messages }] }`
- 保存条件：`messageContent.length > 0`（防止空数据覆盖）

### 消息数据结构

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;        // 必须是字符串，不是 parts 数组
  steps?: WorkflowStep[];
  metadata?: object;
}
```

### 刷新加载

- localStorage → ChatContext → useSSEChat
- **必须**使用 `{ content, steps, metadata }` 平面格式
- **禁止**使用 AI SDK 5.0 的 `parts` 数组格式

## 状态管理

- `AppContext`: 全局状态（用户、认证、弹窗）
- `ChatContext`: 聊天状态（对话历史、消息 CRUD）
- 持久化：localStorage（浏览器端）

## 关键约定

### 文件命名
- 组件：PascalCase（`ChatMessage.tsx`）
- 工具：camelCase（`cache.ts`）
- 类型：PascalCase 接口

### Tailwind CSS
- **禁止**动态类名：`md:grid-cols-${n}` ❌
- 使用条件渲染：`cn("grid", count === 3 && "md:grid-cols-3")` ✅
- **禁止**固定宽高，使用内容撑开
- **禁止**绝对定位布局

### NextAuth
- 版本：v5 (beta.25)
- 配置：`src/auth/config.ts`
- **必须**设置：`session: { strategy: "jwt" }`

### 国际化
- 使用 next-intl
- 全局消息：`src/i18n/messages/{locale}.json`
- 页面消息：`src/i18n/pages/{page}/{locale}.json`
- 语言：`zh`, `en`

## 常见问题

### 其他问题

4. **动态 Tailwind 类失效**
   - 使用条件渲染完整类名

5. **布局泄漏到 chat 路由**
   - 检查路由组结构，chat 必须在 `(chat)/`

6. **i18n 加载失败**
   - 检查 URL 路径包含 locale

7. **Turbopack 缓存问题**
   ```bash
   rm -rf .next && pnpm dev
   ```

## 技术栈

- Next.js 15, React 19, TypeScript 5, Tailwind CSS 4
- NextAuth v5, Drizzle ORM + PostgreSQL
- Shadcn/ui, Radix UI, Framer Motion
- Custom SSE (useSSEChat), OpenAI, DeepSeek
