/**
 * Token Detail API 代理路由
 * 用于获取代币详细信息
 */

import type { BackendTokenResponse } from "@/types/entity";

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({
          code: 1,
          message: "Token parameter is required"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      console.error('[Token API] BACKEND_URL environment variable is not set');
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

    const url = `${backendUrl}/api/v1/tokens/details?token=${encodeURIComponent(token)}`;

    console.log('[Token API] Requesting:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Token API] Backend error:', response.status, errorText);
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

    const data: BackendTokenResponse = await response.json();

    console.log('[Token API] Detail fetched for:', token);

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
    console.error('[Token API] Error:', error);
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
