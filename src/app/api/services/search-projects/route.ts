/**
 * 项目搜索 API 代理路由
 * 用于搜索项目列表 (用于自动补全)
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
      return new Response(
        JSON.stringify({
          code: 1,
          message: "Query parameter is required"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 最少2个字符
    if (query.length < 2) {
      return new Response(
        JSON.stringify({
          code: 0,
          message: "Query too short",
          data: {
            success: true,
            data: {
              projects: [],
              page: 1,
              page_size: 20,
              total: 0,
              has_more: false
            }
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      console.error('[Search Projects API] BACKEND_URL environment variable is not set');
      return new Response(
        JSON.stringify({
          code: 1,
          message: "Backend URL not configured"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const url = `${backendUrl}/api/v1/project/list?query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // 仅记录错误情况
      console.error('[Search Projects API] Backend error:', response.status, errorText);
      return new Response(
        JSON.stringify({
          code: 1,
          message: `Backend API error: ${response.statusText}`
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        code: 0,
        message: "Success",
        data
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error('[Search Projects API] Error:', error);
    return new Response(
      JSON.stringify({
        code: 1,
        message: error instanceof Error ? error.message : "Internal server error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
