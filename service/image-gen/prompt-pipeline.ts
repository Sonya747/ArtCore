import type { DoubaoImageGen, PromptEngineering } from "./typing"
import { retrieveAssetContext } from "./asset-rag"

const SEMANTIC_KEYS: Array<keyof PromptEngineering.SemanticParseResult> = [
  "subject",
  "equipment",
  "scene",
  "style",
]

function buildFallbackPrompt(
  semantic: PromptEngineering.SemanticParseResult,
  assets: PromptEngineering.AssetRetrievalResult,
): PromptEngineering.PromptSynthesisResult {
  const parts: string[] = []
  const refs: string[] = []

  if (semantic.subject) parts.push(semantic.subject)
  if (semantic.equipment) parts.push(`with ${semantic.equipment}`)
  if (semantic.scene) parts.push(`in ${semantic.scene}`)
  if (semantic.style) parts.push(`${semantic.style} style`)

  for (const key of SEMANTIC_KEYS) {
    const item = assets[key]
    if (item?.image_url) {
      refs.push(`referencing the visual features of ${item.keyword}`)
    }
  }

  const prompt = [parts.join(", "), refs.join(", "), "high quality, cinematic lighting"]
    .filter(Boolean)
    .join(", ")

  return {
    prompt: prompt || "high quality image",
    references: refs,
  }
}

/**
 * LLM Call #1: 结构化语义解析（占位）
 * TODO: 接入真实 LLM 语义解析能力
 */
export async function parseSemanticWithLLM(
  _input: PromptEngineering.UserInput,
): Promise<PromptEngineering.SemanticParseResult> {
  return {
    subject: null,
    equipment: null,
    scene: null,
    style: null,
  }
}

export { retrieveAssetContext } from "./asset-rag"

/**
 * LLM Call #2: 上下文感知 Prompt 合成（占位）
 * TODO: 接入真实 LLM Prompt 合成能力
 */
export async function synthesizePromptWithLLM(
  semantic: PromptEngineering.SemanticParseResult,
  assets: PromptEngineering.AssetRetrievalResult,
): Promise<PromptEngineering.PromptSynthesisResult> {
  return buildFallbackPrompt(semantic, assets)
}

function buildGenerationPayload(
  model: string,
  synthesis: PromptEngineering.PromptSynthesisResult,
  options?: Pick<
    PromptEngineering.BuildGenerationPayloadParams,
    "size" | "response_format" | "watermark"
  >,
): DoubaoImageGen.GenerationsRequest {
  return {
    model,
    prompt: synthesis.prompt,
    response_format: options?.response_format ?? "url",
    size: options?.size ?? "2K",
    watermark: options?.watermark ?? true,
    stream: false,
  }
}

/**
 * 提示词工程总流程：
 * 用户输入 -> 语义解析 -> 资产检索 -> Prompt 合成 -> 生图 payload
 */
export async function runPromptEngineeringPipeline(
  params: PromptEngineering.BuildGenerationPayloadParams,
): Promise<PromptEngineering.PromptEngineeringResult> {
  const semantic = await parseSemanticWithLLM(params.userInput)
  const assets = await retrieveAssetContext(semantic)
  const synthesis = await synthesizePromptWithLLM(semantic, assets)
  const payload = buildGenerationPayload(params.model, synthesis, params)

  return {
    semantic,
    assets,
    synthesis,
    payload,
  }
}