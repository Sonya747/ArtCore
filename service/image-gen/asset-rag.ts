import { getAssetsPrisma, resetAssetsPrisma } from "@/lib/prisma-assets-db"
import type { PromptEngineering } from "./typing"

interface AssetRow {
  id: string
  name: string | null
  description: string | null
  preview_url: string | null
}

const SEMANTIC_KEYS: Array<keyof PromptEngineering.SemanticParseResult> = [
  "subject",
  "equipment",
  "scene",
  "style",
]

/**
 * 针对单个关键词，在 assets 表中通过 tags.name 精准匹配 + description 模糊匹配查找资产。
 * 优先返回 tag 精准命中的记录；无命中则退化为 description ILIKE。
 */
async function searchAssetByKeyword(keyword: string): Promise<AssetRow | null> {
  const runQuery = async () => {
    const prisma = getAssetsPrisma()
    const byTag = await prisma.asset.findFirst({
      where: {
        preview_url: { not: null },
        assetTags: {
          some: {
            tag: { name: { equals: keyword, mode: "insensitive" } },
          },
        },
      },
      select: { id: true, name: true, description: true, preview_url: true },
      orderBy: { created_at: "desc" },
    })

    if (byTag) return byTag

    return prisma.asset.findFirst({
      where: {
        preview_url: { not: null },
        description: { contains: keyword, mode: "insensitive" },
      },
      select: { id: true, name: true, description: true, preview_url: true },
      orderBy: { created_at: "desc" },
    })
  }

  const isRetryableConnectionError = (e: unknown): boolean => {
    if (!(e instanceof Error)) return false
    const msg = e.message.toLowerCase()
    return (
      msg.includes("can't reach database server") ||
      msg.includes("error in postgresql connection") ||
      msg.includes("closed") ||
      msg.includes("p1001")
    )
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  try {
    return await runQuery()
  } catch (e) {
    if (!isRetryableConnectionError(e)) {
      throw e
    }
    console.warn("[asset-rag] DB connection failed, retrying once...", e)
    await resetAssetsPrisma()
    await sleep(200)
    return runQuery()
  }
}

function toAssetReference(
  keyword: string,
  row: AssetRow | null,
): PromptEngineering.AssetReference {
  if (!row) {
    return { keyword, image_url: null, description: null, matched: false }
  }
  return {
    id: row.id,
    keyword,
    image_url: row.preview_url,
    description: row.description,
    matched: true,
  }
}

/**
 * 资产关联检索（Asset RAG）
 *
 * 遍历语义解析结果中的四个维度（subject / equipment / scene / style），
 * 对每个非空关键词并行查询 assets 表，返回 preview_url 和 description。
 */
export async function retrieveAssetContext(
  semantic: PromptEngineering.SemanticParseResult,
): Promise<PromptEngineering.AssetRetrievalResult> {
  const entries = SEMANTIC_KEYS
    .filter((key) => semantic[key] !== null)
    .map((key) => ({ key, keyword: semantic[key]! }))

  const rows = await Promise.all(
    entries.map(({ keyword }) => searchAssetByKeyword(keyword)),
  )

  const result: PromptEngineering.AssetRetrievalResult = {}
  entries.forEach(({ key, keyword }, idx) => {
    result[key] = toAssetReference(keyword, rows[idx])
  })

  for (const key of SEMANTIC_KEYS) {
    if (!result[key] && semantic[key] === null) {
      result[key] = { keyword: key, image_url: null, description: null, matched: false }
    }
  }

  return result
}
