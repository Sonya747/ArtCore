import axios from "axios"
import type { DoubaoImageGen } from "./typing"

/** 火山方舟图片生成接口（完整 URL） */
export const DOUBAO_IMAGE_GENERATIONS_URL =
  "https://ark.cn-beijing.volces.com/api/v3/images/generations"

function normalizeBearer(authorization: string): string {
  const t = authorization.trim()
  return t.toLowerCase().startsWith("bearer ") ? t : `Bearer ${t}`
}

/**
 * Doubao / Ark 图片生成：POST `/api/v3/images/generations`
 *
 * @param body 请求体（model、prompt 等）
 * @param authorization Bearer Token（可带或不带 `Bearer ` 前缀）
 */
export async function doubaoImageGenerations(
  body: DoubaoImageGen.GenerationsRequest,
  authorization: string,
): Promise<DoubaoImageGen.GenerationsResponse> {
  const { data } = await axios.post<DoubaoImageGen.GenerationsResponse>(
    DOUBAO_IMAGE_GENERATIONS_URL,
    body,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: normalizeBearer(authorization),
      },
    },
  )
  return data
}
