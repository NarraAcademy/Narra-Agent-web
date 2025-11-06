/**
 * Token Detail API 代理路由
 * 用于获取代币详细信息，应用 Zod 转换和 Debug Header 方案
 */

import { backendTokenResponseSchema } from '@/schemas/entity.schema';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return Response.json(
        {
          code: 1,
          message: "Token parameter is required"
        },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      console.error('[Token API] BACKEND_URL environment variable is not set');
      return Response.json(
        {
          code: 1,
          message: "Backend URL not configured"
        },
        { status: 500 }
      );
    }

    // 1. 检测 Debug 模式
    const isDebugMode = req.headers.get('X-Debug') === 'true'
      || process.env.NODE_ENV === 'development';

    const url = `${backendUrl}/api/v1/tokens/details?token=${encodeURIComponent(token)}`;

    console.log('[Token API] Requesting:', url);
    console.log('[Token API] Debug Mode:', isDebugMode);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Token API] Backend error:', response.status, errorText);
      return Response.json(
        {
          code: 1,
          message: `Backend API error: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    // 2. 获取后端原始数据
    const rawData = await response.json();

    // 3. Zod 转换（Debug 和正常模式都需要）
    const result = backendTokenResponseSchema.safeParse(rawData);

    if (!result.success) {
      // 验证失败：记录原始数据 + 返回错误
      console.error('[Token API] [Validation Failed] Raw Data:', JSON.stringify(rawData, null, 2));
      console.error('[Token API] [Validation Error]:', result.error.issues);
      return Response.json(
        {
          code: 1,
          message: 'Data validation failed',
          // 只在 Debug 模式返回原始数据，避免泄露敏感信息
          ...(isDebugMode ? {
            raw: rawData,
            error: result.error.issues
          } : {})
        },
        { status: 500 }
      );
    }

    // 4. 提取转换后的 Token 数据
    const tokenData = result.data.data;

    console.log('[Token API] Detail fetched and transformed for:', token);

    // 5. 返回数据（Debug 模式额外附加原始数据）
    return Response.json({
      code: 0,
      message: isDebugMode ? "Success (Debug Mode)" : "Success",
      data: tokenData,
      ...(isDebugMode && {
        _debug: true,
        _raw: rawData  // Debug 模式附加原始数据
      })
    });
  } catch (error) {
    console.error('[Token API] Error:', error);
    return Response.json(
      {
        code: 1,
        message: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}
