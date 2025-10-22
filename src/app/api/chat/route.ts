// 使用 Edge Runtime 以避免超时限制，支持长时间的 SSE 连接
export const runtime = 'edge';

// 延长超时时间到 5 分钟（仅在 Node.js runtime 生效）
export const maxDuration = 300;

interface SSEEvent {
  event: string;
  message?: string;
  data?: any;
  error?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[API /api/chat] 收到请求body:', JSON.stringify(body).slice(0, 200));

    // 兼容两种格式：
    // 1. AI SDK格式: { messages: [...], data: {...} }
    // 2. 旧格式: { message: "...", useDeepThinking: true }
    let message: string;
    let useDeepThinking = true;

    if (body.messages && Array.isArray(body.messages)) {
      // AI SDK格式：从messages数组中提取最后一条用户消息
      const lastUserMessage = body.messages
        .filter((m: any) => m.role === 'user')
        .pop();

      if (!lastUserMessage) {
        return new Response(JSON.stringify({ error: "No user message found" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      message = lastUserMessage.content;
      useDeepThinking = body.data?.useDeepThinking ?? true;
    } else if (body.message) {
      // 旧格式
      message = body.message;
      useDeepThinking = body.useDeepThinking ?? true;
    } else {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('[API /api/chat] 提取的消息:', message.slice(0, 100));
    console.log('[API /api/chat] 使用深度思考:', useDeepThinking);

    // 对接后端SSE接口
    const backendUrl = `https://narra-agent-engine-dev-875677964461.asia-southeast1.run.app/api/v1/workflows/alpha/stream?user_input=${encodeURIComponent(message)}&use_deep_thinking=${useDeepThinking}`;

    console.log('[API /api/chat] 开始请求后端:', backendUrl);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Cache-Control": "no-cache",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    console.log('[API /api/chat] 后端响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    console.log('[API /api/chat] 开始转换SSE流为AI SDK格式');

    // 创建自定义流,转换后端SSE为AI SDK格式
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    if (!reader) {
      throw new Error("No response body");
    }

    let buffer = "";
    let steps: any[] = [];
    let metadata: any = null;
    let accumulatedContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('[API /api/chat] SSE流读取完成');

              // 发送最终的data annotation(包含steps和metadata)
              if (steps.length > 0 || metadata) {
                const dataAnnotation = {
                  steps: steps.length > 0 ? steps : undefined,
                  metadata: metadata || undefined,
                };
                // AI SDK Data Stream Protocol: 2: 表示 data
                controller.enqueue(encoder.encode(`2:${JSON.stringify([dataAnnotation])}\n`));
              }

              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed: SSEEvent = JSON.parse(data);

                  switch (parsed.event) {
                    case "start":
                      // 开始事件,可以忽略或记录
                      console.log('[API /api/chat] Stream started');
                      break;

                    case "step":
                      // 收集workflow步骤并实时发送
                      if (parsed.data) {
                        const newStep = {
                          id: parsed.data.step_id || `step-${Date.now()}`,
                          title: parsed.data.title || "处理步骤",
                          agent: parsed.data.agent,
                          status: "running" as const,
                          reasoning: [],
                          timestamp: parsed.data.timestamp,
                        };
                        steps.push(newStep);

                        // 实时发送data annotation
                        controller.enqueue(encoder.encode(`2:${JSON.stringify([{steps: [...steps]}])}\n`));
                      }
                      break;

                    case "reasoning":
                      // 添加reasoning到对应的step并实时发送
                      if (parsed.data) {
                        const stepId = parsed.data.step_id || "default-step";
                        const targetStep = steps.find(s => s.id === stepId);

                        const newReasoning = {
                          id: `reasoning-${Date.now()}-${Math.random()}`,
                          content: parsed.data.content || "",
                          agent: parsed.data.agent || "System",
                          category: parsed.data.category || "info",
                          metadata: parsed.data.metadata,
                          step_id: parsed.data.step_id,
                          timestamp: parsed.data.timestamp,
                        };

                        if (targetStep) {
                          targetStep.reasoning.push(newReasoning);
                          targetStep.status = "running" as const;
                        } else {
                          // 如果找不到step,创建一个默认的
                          const newStep = {
                            id: stepId,
                            title: "其他推理",
                            status: "running" as const,
                            reasoning: [newReasoning]
                          };
                          steps.push(newStep);
                        }

                        // 实时发送data annotation
                        controller.enqueue(encoder.encode(`2:${JSON.stringify([{steps: [...steps]}])}\n`));
                      }
                      break;

                    case "status":
                      // 状态更新,可以忽略或记录
                      break;

                    case "result":
                      // 流式输出文本内容
                      if (parsed.data && parsed.data.content) {
                        accumulatedContent += parsed.data.content;
                        console.log(`[API /api/chat] 🌊 收到result事件chunk:`, {
                          chunkLength: parsed.data.content.length,
                          totalAccumulated: accumulatedContent.length,
                          preview: parsed.data.content.slice(0, 50)
                        });
                        // AI SDK Stream Protocol: 0: 表示文本内容
                        const textChunk = parsed.data.content
                          .replace(/\\/g, '\\\\')
                          .replace(/"/g, '\\"')
                          .replace(/\n/g, '\\n');
                        controller.enqueue(encoder.encode(`0:"${textChunk}"\n`));
                        console.log(`[API /api/chat] ✅ 已发送chunk到响应流`);
                      }
                      break;

                    case "complete":
                      // 完成事件,收集metadata
                      if (parsed.data) {
                        metadata = {
                          tools_used: parsed.data.tools_used,
                          agents_used: parsed.data.agents_used,
                        };

                        // 标记所有steps为completed
                        steps.forEach(step => {
                          if (step.status === "running") {
                            step.status = "completed";
                          }
                        });
                      }
                      break;

                    case "error":
                      console.error('[API /api/chat] 后端错误:', parsed.error);
                      controller.enqueue(encoder.encode(`3:{"error":"${parsed.error || '未知错误'}"}\n`));
                      break;

                    case "done":
                      console.log('[API /api/chat] SSE流结束');
                      break;

                    default:
                      console.warn('[API /api/chat] 未知事件类型:', parsed.event);
                  }
                } catch (e) {
                  console.warn('[API /api/chat] 解析SSE数据失败:', data, e);
                }
              }
            }
          }
        } catch (error) {
          console.error('[API /api/chat] 流处理错误:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[API /api/chat] 错误:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
