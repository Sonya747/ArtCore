import { NextResponse } from "next/server"

/**
 * 服务端代拉远程图片，避免浏览器 fetch 跨域（如豆包 CDN）导致 CORS 失败。
 */
export async function POST(req: Request) {
  let body: { url?: string }
  try {
    body = (await req.json()) as { url?: string }
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const raw = body.url?.trim()
  if (!raw) {
    return NextResponse.json({ error: "url_required" }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 })
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "unsupported_protocol" }, { status: 400 })
  }

  try {
    const upstream = await fetch(raw, {
      redirect: "follow",
      headers: { "User-Agent": "ArtCore-image-proxy/1.0" },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream_failed", status: upstream.status },
        { status: 502 },
      )
    }

    const buf = await upstream.arrayBuffer()
    const ct = upstream.headers.get("content-type") || "application/octet-stream"

    return new NextResponse(buf, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 })
  }
}
