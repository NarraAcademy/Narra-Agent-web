export const runtime = "edge";
export const maxDuration = 300;

const backendUrl = process.env.BACKEND_URL;

export async function POST(req: Request) {
  try {
    const { message, useDeepThinking = false } = await req.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Invalid message" }, { status: 400 });
    }

    const url = `${backendUrl}/api/v1/workflows/alpha/stream?user_input=${encodeURIComponent(
      message
    )}&use_deep_thinking=${useDeepThinking}`;

    const response = await fetch(url, {
      headers: { Accept: "text/event-stream" },
    });

    if (!response.ok || !response.body) {
      return Response.json(
        { error: `Backend error: ${response.status}` },
        { status: response.ok ? 500 : response.status }
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
