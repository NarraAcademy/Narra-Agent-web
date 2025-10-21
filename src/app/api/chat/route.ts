// 使用 Edge Runtime 以避免超时限制，支持长时间的 SSE 连接
export const runtime = 'edge';

// 延长超时时间到 5 分钟（仅在 Node.js runtime 生效）
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { message, useDeepThinking = true } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 对接后端SSE接口
    const backendUrl = `https://narra-agent-engine-dev-875677964461.asia-southeast1.run.app/api/v1/workflows/alpha/stream?user_input=${encodeURIComponent(message)}&use_deep_thinking=${useDeepThinking}`;

    console.log('[API /api/chat] 开始请求后端:', backendUrl);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Cache-Control": "no-cache",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
    });

    console.log('[API /api/chat] 后端响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    console.log('[API /api/chat] 开始转发 SSE 流');

    // 直接转发SSE流
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // 禁用 Nginx 缓冲
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
