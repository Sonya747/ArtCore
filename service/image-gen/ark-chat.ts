import axios from "axios"
import type { ArkChat } from "./typing"

/** 火山方舟 Chat Completions 接口 */
export const ARK_CHAT_COMPLETIONS_URL =
  "https://ark.cn-beijing.volces.com/api/v3/chat/completions"

function normalizeBearer(authorization: string): string {
  const t = authorization.trim()
  return t.toLowerCase().startsWith("bearer ") ? t : `Bearer ${t}`
}

/**
 * 火山方舟 Chat Completions 通用调用
 *
 */
export async function arkChatCompletions(
  body: ArkChat.CompletionsRequest,
  authorization: string,
): Promise<ArkChat.CompletionsResponse> {
  const { data } = await axios.post<ArkChat.CompletionsResponse>(
    ARK_CHAT_COMPLETIONS_URL,
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

/**
 * 从 Chat Completions 响应中提取第一个 choice 的文本内容。
 * 若响应为空则返回 null。
 */
export function extractContent(response: ArkChat.CompletionsResponse): string | null {
  return response.choices?.[0]?.message?.content ?? null
}
