import { upload } from "qiniu-js"

export type QiniuUploadResult = {
  key: string
  hash?: string
}

/**
 * 从服务端接口获取七牛上传凭证（不要在前端直传密钥）。
 */
export async function fetchQiniuUploadToken(): Promise<string> {
  const res = await fetch("/api/oss-action", { method: "POST" })
  const data = (await res.json()) as { token?: string; error?: string }
  if (!res.ok || !data.token) {
    throw new Error(data.error ?? "获取上传凭证失败")
  }
  return data.token
}

/**
 * 拼接对外访问 URL（与 `NEXT_PUBLIC_QINIU_DOMAIN` 一致：仅域名，不含协议）。
 */
export function buildQiniuPublicUrl(objectKey: string): string {
  const domain = process.env.NEXT_PUBLIC_QINIU_DOMAIN?.trim()
  if (!domain) {
    throw new Error("未配置环境变量 NEXT_PUBLIC_QINIU_DOMAIN")
  }
  const host = domain.replace(/^https?:\/\//, "").replace(/\/$/, "")
  const key = objectKey.replace(/^\//, "")
  return `https://${host}/${key}`
}

/**
 * 拉取待上传图片：跨域地址走本服务代理，同源相对路径直接请求。
 */
async function fetchImageBlobForUpload(src: string): Promise<Blob> {
  if (src.startsWith("/")) {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    const res = await fetch(`${origin}${src}`, { cache: "no-store" })
    if (!res.ok) {
      throw new Error(`拉取图片失败 (${res.status}): ${src}`)
    }
    return res.blob()
  }

  const res = await fetch("/api/image-gen/fetch-remote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: src }),
  })

  if (!res.ok) {
    let detail = `拉取图片失败 (${res.status})`
    try {
      const j = (await res.json()) as { error?: string; status?: number }
      if (j.error === "upstream_failed" && typeof j.status === "number") {
        detail = `源站返回 ${j.status}`
      } else if (typeof j.error === "string") {
        detail = j.error
      }
    } catch {
      /* ignore */
    }
    throw new Error(`${detail}: ${src.slice(0, 96)}`)
  }

  return res.blob()
}

function extensionFromMime(mime: string, fallbackUrl: string): string {
  const m = mime.toLowerCase()
  if (m.includes("png")) return "png"
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg"
  if (m.includes("webp")) return "webp"
  if (m.includes("gif")) return "gif"
  if (m.includes("svg")) return "svg"
  const path = fallbackUrl.split("?")[0]?.toLowerCase() ?? ""
  const match = path.match(/\.(png|jpe?g|webp|gif|svg)(?:$)/)
  if (match) return match[1] === "jpeg" ? "jpg" : match[1]
  return "png"
}

/**
 * 浏览器直传七牛（与官方 Observable 用法一致，封装为 Promise）。
 */
export function uploadFileToQiniu(
  file: File,
  key: string,
  token: string,
): Promise<QiniuUploadResult> {
  const observable = upload(file, key, token)
  return new Promise((resolve, reject) => {
    observable.subscribe({
      error: (err) => reject(err instanceof Error ? err : new Error(String(err))),
      complete: (res) => resolve(res as QiniuUploadResult),
    })
  })
}

/**
 * 将远程图片下载为 Blob 后上传到七牛，返回可访问的 HTTPS URL 列表。
 */
export async function uploadRemoteImageUrlsToQiniu(imageUrls: string[]): Promise<string[]> {
  if (imageUrls.length === 0) {
    return []
  }
  const token = await fetchQiniuUploadToken()
  const out: string[] = []

  for (let i = 0; i < imageUrls.length; i++) {
    const src = imageUrls[i]
    const blob = await fetchImageBlobForUpload(src)
    const ext = extensionFromMime(blob.type || "", src)
    const key = `aigc/${Date.now()}-${i}.${ext}`
    const name = key.split("/").pop() ?? `image.${ext}`
    const file = new File([blob], name, { type: blob.type || `image/${ext}` })

    const uploaded = await uploadFileToQiniu(file, key, token)
    out.push(buildQiniuPublicUrl(uploaded.key))
  }

  return out
}
