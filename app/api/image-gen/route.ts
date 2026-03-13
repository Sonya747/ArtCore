import { NextResponse } from "next/server"

const MOCK_IMAGES = [
  "/mock/gen-1.svg",
  "/mock/gen-2.svg",
  "/mock/gen-3.svg",
  "/mock/gen-4.svg",
]

const pad2 = (value: number) => String(value).padStart(2, "0")

const formatTime = (date: Date) => {
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  const hh = pad2(date.getHours())
  const mm = pad2(date.getMinutes())
  const ss = pad2(date.getSeconds())
  return `${y}/${m}/${d} ${hh}:${mm}:${ss}`
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    prompt?: string
    negativePrompt?: string
    ratio?: string
    count?: number
    model?: string
  }

  const count = Math.max(1, Math.min(body.count ?? 4, MOCK_IMAGES.length))
  const now = new Date()

  return NextResponse.json({
    taskId: `task_${now.getTime()}`,
    createdAt: formatTime(now),
    model: body.model ?? "nano_banana_pro",
    ratio: body.ratio ?? "1:1",
    count,
    prompt: body.prompt ?? "",
    negativePrompt: body.negativePrompt ?? "",
    images: MOCK_IMAGES.slice(0, count),
  })
}
