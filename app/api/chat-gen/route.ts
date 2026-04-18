import { NextRequest } from "next/server"

const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"

export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_ARK_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "未配置 ARK API Key" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  const body = await req.json()
  const { messages, model, stream = true, ...rest } = body

  if (!messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: "messages 参数缺失" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const arkBody = {
    model: model || process.env.ARK_CHAT_MODEL || "doubao-seed-2-0-lite-260215",
    messages,
    stream,
    ...rest,
  }

  const res = await fetch(ARK_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(arkBody),
  })
  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })

}
