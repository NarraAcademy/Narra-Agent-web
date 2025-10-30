/**
 * Project Detail API 代理路由
 * 用于获取项目详细信息
 */

import type { BackendProjectResponse } from "@/types/entity";

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');

    if (!entity) {
      return new Response(
        JSON.stringify({
          code: 1,
          message: "Entity parameter is required"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      console.error('[Project API] BACKEND_URL environment variable is not set');
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

    const url = `${backendUrl}/api/v1/project/detail?project=${encodeURIComponent(entity)}`;

    console.log('[Project API] Requesting:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Project API] Backend error:', response.status, errorText);
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

    const data: BackendProjectResponse = await response.json();

    console.log('[Project API] Detail fetched for:', entity);

    // 返回后端数据
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
    console.error('[Project API] Error:', error);
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
