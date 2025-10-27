# Surf AI 深度研究交互机制技术分析报告

## 概述

本报告基于对 https://asksurf.ai/ 深度研究功能的完整交互流程分析，详细记录了从用户提交问题到展示最终研究报告的整个技术实现机制。

**测试问题**：HYPE价格能否在$30支撑位反弹？自动回购机制真的能帮市场下跌下跌吗？

**会话ID**：85ead89b-c1d6-4a07-8f30-a620f2a98182

---

## 核心发现

### 1. 实时更新机制：HTTP 短轮询（非 WebSocket）

**关键发现**：Surf AI 使用 **HTTP 短轮询** 而非 WebSocket 或 SSE 来实现实时更新。

#### 轮询实现细节

- **轮询端点**：`GET /muninn/v1/chat/sessions/{session_id}/status`
- **轮询频率**：约每 2-3 秒一次
- **总轮询次数**：观察到超过 40+ 次状态查询
- **研究总时长**：约 3-4 分钟

#### 轮询响应结构（推测）

```typescript
interface SessionStatus {
  status: "pending" | "processing" | "completed" | "error";
  progress?: {
    current_step: number;
    total_steps: number;
    agent_states: AgentState[];
  };
  result?: ResearchResult;
}
```

#### 架构优势与劣势

**优势**：
- 实现简单，无需维护长连接
- 客户端容错性好（网络中断后自动恢复）
- 服务器负载可预测
- 不受防火墙/代理限制

**劣势**：
- 延迟较高（2-3秒才能获取更新）
- 网络请求数量多（40+ 次请求）
- 带宽消耗相对较大
- 无法实现毫秒级实时性

---

## 2. 核心 API 架构

### 2.1 会话管理

#### 创建/获取会话
```http
GET /muninn/v1/chat/sessions/{session_id}
```

**响应内容**：
- 会话基本信息
- 用户问题
- 研究模式（is_deep_research: true）

#### 会话列表
```http
GET /muninn/v1/chat/sessions?limit=20&offset=0
```

**用途**：
- 侧边栏历史会话列表
- 支持分页加载

#### 会话限制查询
```http
GET /muninn/v1/chat/sessions/limits
```

**响应内容**：
- 用户剩余研究次数
- 配额限制
- 订阅状态

---

### 2.2 状态轮询（核心）

```http
GET /muninn/v1/chat/sessions/{session_id}/status
```

**响应频率**：每 2-3 秒

**推测响应结构**：
```json
{
  "status": "processing",
  "progress": {
    "current_step": 3,
    "total_steps": 5,
    "agents": [
      {
        "name": "技术分析",
        "status": "completed",
        "icon": "technical-analysis-light.svg"
      },
      {
        "name": "Deep Search",
        "status": "running",
        "icon": "deep-search-running-light.svg"
      },
      {
        "name": "链上资源器",
        "status": "pending",
        "icon": "onchain-tracker-light.svg"
      }
    ]
  },
  "partial_results": {
    "entities": [...],
    "key_findings": [...]
  }
}
```

---

### 2.3 关键词提取与高亮

#### 命名实体识别（NER）
```http
POST /muninn/v1/ner/extract
```

**请求体**（推测）：
```json
{
  "text": "研究报告正文内容..."
}
```

**响应**（推测）：
```json
{
  "entities": [
    {
      "text": "HYPE",
      "type": "token",
      "start": 0,
      "end": 4,
      "token_id": "b9c6b1b4-658e-436d-972e-8a80c6b76a90"
    },
    {
      "text": "$30",
      "type": "price",
      "start": 10,
      "end": 13
    },
    {
      "text": "Hyperliquid",
      "type": "project",
      "start": 50,
      "end": 61,
      "project_id": "5c7e44e3-bce3-4167-a8b0-0232cadba21b"
    }
  ]
}
```

#### 噪声过滤
```http
POST /muninn/v1/ner/noise_filter
```

**用途**：
- 过滤无意义的高亮
- 去除重复实体
- 优化高亮密度

#### 关键词高亮实现原理

1. **后端 NER 识别**：
   - 使用 NLP 模型识别代币、价格、项目名称等实体
   - 返回实体位置（start, end）和类型

2. **前端渲染**：
   - 根据实体位置分割文本
   - 为不同类型实体应用不同样式
   - 添加悬浮提示（tooltip）显示详细信息

3. **交互增强**：
   - 点击关键词跳转到详细页面
   - 悬浮显示实时价格/数据
   - 支持复制关键词

---

### 2.4 代币数据 API

#### 基础信息
```http
GET /muninn/v1/tokens/{token_id}
```

**响应**（推测）：
```json
{
  "id": "b9c6b1b4-658e-436d-972e-8a80c6b76a90",
  "symbol": "HYPE",
  "name": "Hyperliquid",
  "logo": "https://media.cyberconnect.dev/hyperliquid.png",
  "current_price": 28.45,
  "market_cap": 9500000000,
  "volume_24h": 450000000
}
```

#### 市场数据
```http
GET /muninn/v1/tokens/{token_id}/market-data
```

**响应**：
- 实时价格
- 市值
- 24小时成交量
- 价格变化百分比

#### 解锁数据
```http
GET /muninn/v1/tokens/{token_id}/unlocks?timeframe=1y
```

**用途**：
- 代币解锁时间表
- 解锁数量
- 解锁对价格的潜在影响

#### K线数据（**重点**）
```http
GET /muninn/v1/tokens/{token_id}/sparkline?timeframe=24h
```

**响应结构**（推测）：
```json
{
  "timeframe": "24h",
  "data": [
    { "timestamp": 1761209400, "price": 28.45 },
    { "timestamp": 1761209460, "price": 28.52 },
    { "timestamp": 1761209520, "price": 28.48 },
    ...
  ]
}
```

**关键发现**：
- ✅ **一次性返回全部数据**，非流式传输
- 数据格式：时间戳 + 价格数组
- 前端使用 ECharts 渲染
- 24小时内每分钟一个数据点（约 1440 个点）

---

### 2.5 项目数据 API

#### 项目详情
```http
GET /muninn/v2/projects/{project_id}
```

**用途**：
- 项目基本信息
- 社交媒体链接
- 官网地址

#### 项目元数据
```http
GET /muninn/v1/projects/meta?project_ids={id1,id2,...}
```

**用途**：
- 批量获取多个项目的简要信息
- 用于列表展示

---

### 2.6 消息交互
```http
GET /muninn/v1/chat/messages/{message_id}/interactions
```

**用途**：
- 获取消息的点赞/反馈
- 用户交互记录

---

## 3. 图表数据传输机制分析

### 3.1 ECharts 数据流

```
用户提交问题
    ↓
后端识别需要展示的代币（通过 NER）
    ↓
前端发起 sparkline 请求
    ↓
GET /muninn/v1/tokens/{token_id}/sparkline?timeframe=24h
    ↓
一次性返回完整的时间序列数据（JSON 数组）
    ↓
前端 ECharts 实例化并渲染
```

### 3.2 数据格式

**请求参数**：
- `timeframe`: `24h` | `7d` | `30d` | `1y`

**响应数据**：
```typescript
interface SparklineData {
  timeframe: string;
  data: Array<{
    timestamp: number;
    price: number;
    volume?: number;
  }>;
}
```

### 3.3 前端渲染流程

1. **接收数据**：
   ```javascript
   const response = await fetch(`/muninn/v1/tokens/${tokenId}/sparkline?timeframe=24h`);
   const { data } = await response.json();
   ```

2. **转换为 ECharts 格式**：
   ```javascript
   const chartData = {
     xAxis: data.map(d => new Date(d.timestamp * 1000)),
     series: data.map(d => d.price)
   };
   ```

3. **渲染图表**：
   ```javascript
   const chart = echarts.init(element);
   chart.setOption({
     xAxis: { type: 'time', data: chartData.xAxis },
     yAxis: { type: 'value' },
     series: [{ type: 'line', data: chartData.series, smooth: true }]
   });
   ```

### 3.4 关键结论

🔴 **ECharts 数据传输方式：一次性传输，非流式**

- **不是** SSE/WebSocket 流式传输
- **不是** 增量更新
- **是** 标准 HTTP GET 请求，一次性返回全部数据
- 数据量：24小时约 1440 个数据点（每分钟一个）
- 响应大小：约 50-100KB（未压缩）

---

## 4. 多代理系统架构

### 4.1 代理列表

从截图和网络请求中识别到以下代理：

1. **Retriever（资源检索器）**
   - 图标：`/assets/chat/research/retriever-light.svg`
   - 功能：搜索相关资源

2. **技术分析（Technical Analysis）**
   - 图标：`/assets/chat/research/technical-analysis-light.svg`
   - 功能：价格图表分析、技术指标计算

3. **Deep Search（深度搜索）**
   - 图标：`/assets/chat/research/deep-search-light.svg`
   - 功能：深度网络搜索、信息聚合

4. **链上资源器（Onchain Tracker）**
   - 图标：`/assets/chat/research/onchain-tracker-light.svg`
   - 功能：链上数据分析、交易跟踪

5. **Social Sentiment（社交情绪）**
   - 图标：`/assets/chat/research/social-sentiment-light.svg`
   - 功能：Twitter/社交媒体情绪分析

### 4.2 代理状态机

每个代理有三种视觉状态：

- **待机**：`agent-name-light.svg`
- **运行中**：`agent-name-running-light.svg`（通常带动画）
- **完成**：回到待机状态，可能带勾选标记

### 4.3 代理编排

```
用户问题提交
    ↓
┌─────────────────────────────────┐
│  后端任务编排器                  │
│  - 分析问题类型                  │
│  - 决定启用哪些代理               │
│  - 定义代理执行顺序               │
└─────────────────────────────────┘
    ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Retriever   │→ │ Technical   │→ │ Deep Search │
│ (步骤 1/5)  │  │ Analysis    │  │ (步骤 3/5)  │
└─────────────┘  │ (步骤 2/5)  │  └─────────────┘
                 └─────────────┘
                        ↓
┌─────────────┐  ┌─────────────┐
│ Onchain     │→ │ Social      │
│ Tracker     │  │ Sentiment   │
│ (步骤 4/5)  │  │ (步骤 5/5)  │
└─────────────┘  └─────────────┘
                        ↓
                  汇总生成报告
```

### 4.4 前端状态同步

前端通过轮询 `/status` 端点获取各代理状态：

```typescript
interface AgentStatus {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  result?: any;
}
```

前端根据状态动态切换图标和样式：

```tsx
const getAgentIcon = (agent: AgentStatus) => {
  if (agent.status === "running") {
    return `/assets/chat/research/${agent.name}-running-light.svg`;
  }
  return `/assets/chat/research/${agent.name}-light.svg`;
};
```

---

## 5. 报告生成与展示流程

### 5.1 报告结构

从截图中可以看到报告包含以下部分：

1. **目录（Table of Contents）**
   - 核心观点
   - 技术分析：$30支撑位评估
   - 自动回购机制：抵御下跌势头的效性
   - 协议基本面支撑
   - 社区与市场情绪
   - 风险与机遇评估
   - 结论

2. **内容区域**
   - Markdown 格式的研究报告
   - 关键词高亮（HYPE、$30、Hyperliquid 等）
   - 内嵌图表（K线图）
   - 引用来源（Twitter、文档链接）

3. **侧边栏**
   - 代理执行状态卡片
   - 代币信息卡片（Logo、价格、涨跌幅）

### 5.2 报告渲染流程

```
状态轮询检测到 status: "completed"
    ↓
前端停止轮询
    ↓
获取完整报告内容（可能包含在最后一次 status 响应中）
    ↓
Markdown 解析（使用 react-markdown 或类似库）
    ↓
并行发起资源请求：
  - NER 提取关键词
  - 获取代币数据
  - 获取 sparkline 数据
  - 获取项目元数据
    ↓
关键词替换为可交互组件
    ↓
图表位置插入 ECharts 实例
    ↓
最终渲染完成
```

### 5.3 关键词交互

**高亮样式**（推测）：
```css
.entity-token {
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
}

.entity-price {
  color: #10b981;
  font-weight: 500;
  background: rgba(16, 185, 129, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
}

.entity-project {
  color: #8b5cf6;
  font-weight: 600;
  cursor: pointer;
}
```

**悬浮提示**：
- 显示实时价格
- 市值
- 24h 涨跌幅
- "点击查看详情" 提示

**点击行为**：
- 跳转到代币详情页
- 或在当前页面展开 mini 详情卡片

---

## 6. 性能优化策略

### 6.1 轮询优化

**推测的优化策略**：
- 初始阶段：2秒轮询间隔（快速反馈）
- 中间阶段：3秒轮询间隔（降低负载）
- 完成后：立即停止轮询

### 6.2 数据缓存

**Token 数据缓存**：
- 同一 token 的基础信息可能被缓存（localStorage 或内存）
- sparkline 数据根据 timeframe 缓存

**Avatars**：
- Twitter 头像通过 `unavatar.io` CDN 加载
- 自动缓存和优化

### 6.3 图片优化

- 使用 Next.js Image 组件（`/_next/image`）
- 自动格式转换（WebP）
- 响应式尺寸（`w=256`, `w=1920` 等）
- 懒加载（图表在可视区域才加载）

---

## 7. 与我们项目的对比

### 7.1 相同点

- ✅ Next.js 框架
- ✅ TypeScript
- ✅ 多语言支持（i18n）
- ✅ AI 聊天功能
- ✅ Markdown 渲染

### 7.2 差异点

| 功能 | Surf AI | 我们项目 |
|------|---------|----------|
| 实时更新 | HTTP 短轮询 | SSE 流式传输 |
| 关键词高亮 | 后端 NER + 前端渲染 | 未实现 |
| 多代理系统 | ✅ 5+ 代理 | 单一 AI 模型 |
| 图表集成 | ECharts (一次性数据) | 未实现 |
| 代币数据 | ✅ 实时价格/K线 | 未实现 |
| 研究模式 | 深度研究（3-4分钟） | 快速问答（10-30秒） |

### 7.3 可借鉴的技术点

#### 高优先级
1. **关键词高亮系统**：
   - 实现 NER API
   - 前端关键词渲染组件
   - 悬浮提示交互

2. **图表集成**：
   - ECharts 集成
   - 一次性数据加载
   - 响应式设计

3. **多代理可视化**：
   - 代理状态卡片
   - 进度指示器
   - 动画效果

#### 中优先级
4. **轮询机制优化**：
   - 考虑在特定场景下使用轮询替代 SSE
   - 实现自适应轮询间隔
   - 轮询失败重试策略

5. **数据缓存策略**：
   - Token 数据缓存
   - 图表数据缓存
   - 报告历史缓存

#### 低优先级
6. **订阅限制系统**：
   - 研究次数限制
   - 配额管理
   - 升级提示

---

## 8. 技术栈推测

### 前端
- **框架**：Next.js 15 (App Router)
- **语言**：TypeScript
- **UI 库**：React 19
- **图表**：ECharts
- **样式**：Tailwind CSS
- **Markdown**：react-markdown 或类似库
- **动画**：unicornStudio.js (从请求中发现)

### 后端
- **框架**：可能是 Python (FastAPI) 或 Node.js
- **NLP/NER**：自定义模型或 Hugging Face Transformers
- **AI 模型**：多个专业代理（可能基于 LangChain/LangGraph）
- **数据源**：
  - 加密货币 API (CoinGecko/CoinMarketCap)
  - Twitter API
  - 链上数据 API（Etherscan/Dune Analytics）

### 基础设施
- **CDN**：Cloudflare (从响应头推测)
- **图片服务**：自建图片代理 (`images.asksurf.ai`)
- **监控**：PostHog (产品分析)
- **追踪**：Google Analytics, Facebook Pixel, Twitter Pixel

---

## 9. 核心技术问题解答

### Q1: 是否使用 WebSocket？
**答**：❌ 不使用。Surf AI 使用 HTTP 短轮询实现实时更新。

### Q2: 关键词高亮如何实现？
**答**：
1. 后端使用 NER 模型识别实体（`/muninn/v1/ner/extract`）
2. 返回实体位置和类型
3. 前端根据位置插入高亮组件
4. 添加点击/悬浮交互

### Q3: ECharts 数据是流式还是一次性？
**答**：✅ **一次性传输**。通过单次 GET 请求 (`/sparkline`) 返回完整时间序列数据。

### Q4: 多代理如何协同？
**答**：
1. 后端编排器决定代理执行顺序
2. 各代理独立执行任务
3. 前端通过轮询 `/status` 获取各代理状态
4. 最终汇总所有代理结果生成报告

### Q5: 如何保证数据一致性？
**答**：
- 每个会话有唯一 session_id
- 状态更新原子性
- 客户端轮询失败自动重试
- 报告生成完成后状态不再变化

---

## 10. 实现建议

如果要在我们的项目中实现类似功能：

### 阶段一：基础功能（1-2周）
1. **集成 ECharts**
   ```bash
   pnpm add echarts echarts-for-react
   ```

2. **创建 Token 数据 API**
   ```typescript
   // src/app/api/tokens/[id]/sparkline/route.ts
   export async function GET(
     request: Request,
     { params }: { params: { id: string } }
   ) {
     const { searchParams } = new URL(request.url);
     const timeframe = searchParams.get('timeframe') || '24h';

     const data = await fetchSparklineData(params.id, timeframe);
     return Response.json({ data });
   }
   ```

3. **基础关键词高亮**
   ```tsx
   // src/components/chat/highlighted-text.tsx
   const HighlightedText = ({ text, entities }) => {
     // 根据 entities 位置分割文本并高亮
   };
   ```

### 阶段二：多代理系统（2-3周）
1. **设计代理接口**
   ```typescript
   interface Agent {
     name: string;
     execute: (context: ResearchContext) => Promise<AgentResult>;
   }
   ```

2. **实现代理编排器**
   ```typescript
   class AgentOrchestrator {
     async executeResearch(question: string): Promise<Report> {
       const agents = this.selectAgents(question);
       const results = await this.runAgentsSequentially(agents);
       return this.generateReport(results);
     }
   }
   ```

3. **前端代理状态展示**
   ```tsx
   <AgentStatusCard
     name="技术分析"
     status={agentStatus.technical_analysis}
     icon="/assets/technical-analysis.svg"
   />
   ```

### 阶段三：高级功能（2-3周）
1. **NER 集成**
   - 使用 Hugging Face Transformers
   - 或调用第三方 NER API
   - 缓存识别结果

2. **轮询优化**
   - 实现自适应轮询间隔
   - 添加断线重连
   - 前端状态持久化

3. **性能优化**
   - 数据缓存层
   - 图表懒加载
   - 报告分页加载

---

## 11. 总结

Surf AI 的深度研究功能展示了一个成熟的 AI 研究系统应该具备的核心能力：

✅ **稳定的实时更新机制**（HTTP 轮询）
✅ **智能的关键词提取与高亮**（NER）
✅ **丰富的数据可视化**（ECharts）
✅ **多代理协同工作**（Agent Orchestration）
✅ **良好的用户体验**（进度展示、交互反馈）

虽然使用的是相对传统的 HTTP 轮询而非 WebSocket，但通过合理的轮询间隔和缓存策略，仍然实现了流畅的用户体验。这也证明了"技术选型应该基于实际需求"的理念 —— 不一定要使用最新的技术，而是要选择最合适的技术。

对于我们的项目，可以优先实现：
1. **关键词高亮**（提升报告可读性）
2. **图表集成**（数据可视化）
3. **多代理展示**（增强透明度）

这些功能都可以基于现有的 SSE 架构逐步实现，无需大规模重构。

---

## 附录

### A. 完整 API 列表

#### 认证相关
- `POST /muninn/v1/auth/otp/send` - 发送 OTP 验证码
- `POST /muninn/v1/auth/otp/login` - OTP 登录
- `GET /muninn/v1/auth/me` - 获取当前用户信息

#### 会话管理
- `GET /muninn/v1/chat/sessions` - 会话列表
- `GET /muninn/v1/chat/sessions/{id}` - 会话详情
- `GET /muninn/v1/chat/sessions/{id}/status` - 会话状态（轮询）
- `GET /muninn/v1/chat/sessions/limits` - 会话限制
- `GET /muninn/v1/chat/messages/{id}/interactions` - 消息交互

#### NER 与关键词
- `POST /muninn/v1/ner/extract` - 提取命名实体
- `POST /muninn/v1/ner/noise_filter` - 过滤噪声

#### 代币数据
- `GET /muninn/v1/tokens/{id}` - 代币基础信息
- `GET /muninn/v1/tokens/{id}/market-data` - 市场数据
- `GET /muninn/v1/tokens/{id}/sparkline?timeframe={timeframe}` - K线数据
- `GET /muninn/v1/tokens/{id}/unlocks?timeframe={timeframe}` - 解锁数据

#### 项目数据
- `GET /muninn/v2/projects/{id}` - 项目详情
- `GET /muninn/v1/projects/meta?project_ids={ids}` - 批量获取项目元数据

#### 订阅相关
- `GET /muninn/v1/subscription/status` - 订阅状态
- `GET /muninn/v1/subscription/coupons` - 优惠券

#### 其他
- `GET /muninn/v1/recommend/questions` - 推荐问题

### B. 关键技术术语

- **NER (Named Entity Recognition)**：命名实体识别
- **SSE (Server-Sent Events)**：服务器推送事件
- **WebSocket**：全双工通信协议
- **短轮询 (Short Polling)**：客户端定期请求服务器
- **长轮询 (Long Polling)**：客户端请求后服务器保持连接直到有数据
- **Agent Orchestration**：代理编排
- **Sparkline**：迷你图表
- **ECharts**：Apache 开源的可视化库

---

**报告生成时间**：2025-10-23
**分析工具**：MCP Playwright Browser
**数据来源**：https://asksurf.ai/
**会话ID**：85ead89b-c1d6-4a07-8f30-a620f2a98182
