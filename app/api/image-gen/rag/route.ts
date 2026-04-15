import { NextResponse } from "next/server"
import { retrieveAssetContext } from "@/service/image-gen/asset-rag"
import type { PromptEngineering } from "@/service/image-gen/typing"

export async function POST(req: Request) {
  let body: { semantic?: PromptEngineering.SemanticParseResult }
  try {
    body = (await req.json()) as { semantic?: PromptEngineering.SemanticParseResult }
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const semantic = body.semantic
  if (!semantic) {
    return NextResponse.json({ error: "semantic_required" }, { status: 400 })
  }

  try {
    const assets = await retrieveAssetContext(semantic)
    return NextResponse.json({ assets })
  } catch (e) {
    console.error("[api/image-gen/rag]", e)
    const error = e instanceof Error ? e.message : "rag_failed"
    return NextResponse.json({ error }, { status: 500 })
  }
}
