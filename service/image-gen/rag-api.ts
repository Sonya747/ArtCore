import type { PromptEngineering } from "./typing"

interface RetrieveAssetContextResponse {
  assets: PromptEngineering.AssetRetrievalResult
}

export async function retrieveAssetContextByApi(
  semantic: PromptEngineering.SemanticParseResult,
): Promise<PromptEngineering.AssetRetrievalResult> {
  const res = await fetch("/api/image-gen/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ semantic }),
  })

  const data = (await res.json().catch(() => ({}))) as
    | RetrieveAssetContextResponse
    | { error?: string }
  if (!res.ok) {
    throw new Error(
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : "资产检索失败",
    )
  }

  return (data as RetrieveAssetContextResponse).assets
}
