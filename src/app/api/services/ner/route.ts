/**
 * NER API 代理路由
 * 用于识别文本中的实体(PROJECT/TOKEN/ORGANIZATION/PERSON/TECHNOLOGY/CHAIN)
 */

import type { Entity } from "@/types/entity";

export const runtime = 'edge';

interface NERRequest {
  text: string;
}

interface BackendNERResponse {
  text: string;
  entities: Entity[];
  count: number;
}

export async function POST(req: Request) {
  try {
    const body: NERRequest = await req.json();

    if (!body.text || typeof body.text !== 'string') {
      return new Response(
        JSON.stringify({
          code: 1,
          message: "Text is required and must be a string"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      console.error('[NER API] BACKEND_URL environment variable is not set');
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

    // 正确的后端路径是 /api/v1/ner/recognize
    const url = `${backendUrl}/api/v1/ner/recognize`;

    console.log('[NER API] Requesting:', url);
    console.log('[NER API] Text length:', body.text.length);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: body.text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NER API] Backend error:', response.status, errorText);
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

    const backendData: BackendNERResponse = await response.json();

    console.log('[NER API] Entities found:', backendData.entities?.length || 0);

    // 直接返回后端数据格式,前端已经适配
    return new Response(
      JSON.stringify({
        code: 0,
        message: "Success",
        data: {
          entities: backendData.entities
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error('[NER API] Error:', error);
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
