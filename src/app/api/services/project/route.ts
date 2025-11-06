/**
 * Project Detail API 代理路由
 * 用于获取项目详细信息，应用 Zod 转换和 Debug Header 方案
 */

import { backendProjectResponseSchema } from '@/schemas/entity.schema';
import type { UnifiedEntityDetail } from '@/types/unified-entity';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');

    if (!entity) {
      return Response.json(
        {
          code: 1,
          message: "Entity parameter is required"
        },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      console.error('[Project API] BACKEND_URL environment variable is not set');
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

    const url = `${backendUrl}/api/v1/project/detail?project=${encodeURIComponent(entity)}`;

    console.log('[Project API] Requesting:', url);
    console.log('[Project API] Debug Mode:', isDebugMode);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Project API] Backend error:', response.status, errorText);
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
    const result = backendProjectResponseSchema.safeParse(rawData);

    if (!result.success) {
      // 验证失败：记录原始数据 + 返回错误
      console.error('[Project API] [Validation Failed] Raw Data:', JSON.stringify(rawData, null, 2));
      console.error('[Project API] [Validation Error]:', result.error.issues);
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

    // 4. 提取转换后的 Project 数据
    const projectData: UnifiedEntityDetail = result.data.data.project;

    console.log('[Project API] Detail fetched and transformed for:', entity);

    // 5. 返回数据（Debug 模式额外附加原始数据）
    return Response.json({
      code: 0,
      message: isDebugMode ? "Success (Debug Mode)" : "Success",
      data: projectData,
      ...(isDebugMode ? {
        _debug: true,
        _raw: rawData  // Debug 模式附加原始数据
      } : {})
    });
  } catch (error) {
    console.error('[Project API] Error:', error);
    return Response.json(
      {
        code: 1,
        message: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}
