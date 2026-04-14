import type { ArkChat, DoubaoImageGen, PromptEngineering } from "./typing"
import { arkChatCompletions, extractContent } from "./ark-chat"
import { retrieveAssetContext } from "./asset-rag"

export { retrieveAssetContext } from "./asset-rag"

/** 语义解析用的 LLM 模型（可按需切换） */
const SEMANTIC_MODEL = "doubao-pro-32k-240615"
/** Prompt 合成用的 LLM 模型 */
const SYNTHESIS_MODEL = "doubao-pro-32k-240615"

const SEMANTIC_KEYS: Array<keyof PromptEngineering.SemanticParseResult> = [
  "subject",
  "equipment",
  "scene",
  "style",
]

const SEMANTIC_PARSE_SCHEMA: ArkChat.JsonSchema = {
  name: "semantic_parse",
  strict: true,
  schema: {
    type: "object",
    properties: {
      subject: { type: ["string", "null"], description: "主体/角色" },
      equipment: { type: ["string", "null"], description: "装备/道具" },
      scene: { type: ["string", "null"], description: "场景/环境" },
      style: { type: ["string", "null"], description: "画面风格" },
    },
    required: ["subject", "equipment", "scene", "style"],
    additionalProperties: false,
  },
}

const SEMANTIC_SYSTEM_PROMPT =
  "你是一个语义解析器。请从用户输入中提取以下四个维度的信息：" +
  "主体(subject)、装备(equipment)、场景(scene)、风格(style)。" +
  "若用户未明确提及某一项，则该项设为 null。" +
  "严格按照给定的 JSON Schema 输出 JSON，不要输出任何其他内容。"

const SYNTHESIS_SYSTEM_PROMPT =
  "你是一个 Stable Diffusion / 图像生成提示词专家。请根据以下提供的语义解析结果与资产描述，合成一段高质量的英文图像生成 Prompt。\n" +
  "规则：\n" +
  "1. 若提供了资产描述，必须将其视觉特征融入 Prompt 中，并加入 \"as shown in the reference image\" 或 \"referencing the visual features of [Subject]\" 的表述。\n" +
  "2. Prompt 应包含主体描述、环境/场景、光照、画质等常见修饰词。\n" +
  "3. 仅输出最终 Prompt 文本，不要输出任何解释或 JSON。"

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

function buildSynthesisUserMessage(
  semantic: PromptEngineering.SemanticParseResult,
  assets: PromptEngineering.AssetRetrievalResult,
): string {
  const lines: string[] = ["## 语义解析结果", JSON.stringify(semantic, null, 2), ""]

  const matchedAssets = SEMANTIC_KEYS
    .map((key) => assets[key])
    .filter((a): a is PromptEngineering.AssetReference => !!a?.matched)

  if (matchedAssets.length > 0) {
    lines.push("## 资产库匹配结果")
    for (const asset of matchedAssets) {
      lines.push(`- 关键词: ${asset.keyword}`)
      if (asset.description) lines.push(`  描述: ${asset.description}`)
      if (asset.image_url) lines.push(`  参考图: ${asset.image_url}`)
    }
  } else {
    lines.push("## 资产库匹配结果", "未检索到匹配资产，请仅基于语义解析结果生成 Prompt。")
  }

  return lines.join("\n")
}

/**
 * LLM Call #1: 结构化语义解析
 *
 * 调用火山方舟 Chat Completions API，使用 response_format: json_schema
 * 将用户自然语言输入解析为结构化 JSON（subject / equipment / scene / style）。
 */
export async function parseSemanticWithLLM(
  input: PromptEngineering.UserInput,
  authorization?: string,
): Promise<PromptEngineering.SemanticParseResult> {
  const apiKey = authorization ?? process.env.NEXT_PUBLIC_ARK_API_KEY
  if (!apiKey) {
    console.warn("[parseSemanticWithLLM] 未配置 ARK_API_KEY，返回空解析结果")
    return { subject: null, equipment: null, scene: null, style: null }
  }

  try {
    const response = await arkChatCompletions(
      {
        model: SEMANTIC_MODEL,
        messages: [
          { role: "system", content: SEMANTIC_SYSTEM_PROMPT },
          { role: "user", content: input.text },
        ],
        response_format: {
          type: "json_schema",
          json_schema: SEMANTIC_PARSE_SCHEMA,
        },
        temperature: 0,
        stream: false,
      },
      apiKey,
    )

    const raw = extractContent(response)
    if (!raw) {
      console.warn("[parseSemanticWithLLM] LLM 返回空内容，使用 fallback")
      return { subject: null, equipment: null, scene: null, style: null }
    }

    const parsed = JSON.parse(raw) as PromptEngineering.SemanticParseResult
    return {
      subject: parsed.subject ?? null,
      equipment: parsed.equipment ?? null,
      scene: parsed.scene ?? null,
      style: parsed.style ?? null,
    }
  } catch (e) {
    console.error("[parseSemanticWithLLM] LLM 调用失败，使用 fallback", e)
    return { subject: null, equipment: null, scene: null, style: null }
  }
}

/**
 * LLM Call #2: 上下文感知 Prompt 合成
 *
 * 调用火山方舟 Chat Completions API（普通文本生成），
 * 将语义解析结果和资产描述融合，输出一段高质量的英文图像生成 Prompt。
 */
export async function synthesizePromptWithLLM(
  semantic: PromptEngineering.SemanticParseResult,
  assets: PromptEngineering.AssetRetrievalResult,
  authorization?: string,
): Promise<PromptEngineering.PromptSynthesisResult> {
  const apiKey = authorization ?? process.env.NEXT_PUBLIC_ARK_API_KEY
  if (!apiKey) {
    console.warn("[synthesizePromptWithLLM] 未配置 ARK_API_KEY，使用本地 fallback")
    return buildFallbackPrompt(semantic, assets)
  }

  try {
    const userMessage = buildSynthesisUserMessage(semantic, assets)

    const response = await arkChatCompletions(
      {
        model: SYNTHESIS_MODEL,
        messages: [
          { role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        stream: false,
      },
      apiKey,
    )

    const prompt = extractContent(response)?.trim()
    if (!prompt) {
      console.warn("[synthesizePromptWithLLM] LLM 返回空内容，使用本地 fallback")
      return buildFallbackPrompt(semantic, assets)
    }

    const references = SEMANTIC_KEYS
      .map((key) => assets[key])
      .filter((a): a is PromptEngineering.AssetReference => !!a?.matched && !!a.image_url)
      .map((a) => a.image_url!)

    return { prompt, references }
  } catch (e) {
    console.error("[synthesizePromptWithLLM] LLM 调用失败，使用本地 fallback", e)
    return buildFallbackPrompt(semantic, assets)
  }
}

function collectReferenceImages(
  assets: PromptEngineering.AssetRetrievalResult,
): string[] {
  return SEMANTIC_KEYS
    .map((key) => assets[key])
    .filter((a): a is PromptEngineering.AssetReference => !!a?.matched && !!a.image_url)
    .map((a) => a.image_url!)
}

function buildGenerationPayload(
  model: string,
  synthesis: PromptEngineering.PromptSynthesisResult,
  referenceImages: string[],
  options?: Pick<
    PromptEngineering.BuildGenerationPayloadParams,
    "size" | "response_format" | "watermark"
  >,
): DoubaoImageGen.GenerationsRequest {
  return {
    model,
    prompt: synthesis.prompt,
    image: referenceImages.length > 0 ? referenceImages : undefined,
    response_format: options?.response_format ?? "url",
    size: options?.size ?? "2K",
    watermark: options?.watermark ?? true,
    stream: false,
  }
}

/**
 * 提示词工程总流程：
 * 用户输入 → LLM①语义解析 → 资产检索 → LLM②Prompt合成 → 生图 payload
 */
export async function runPromptEngineeringPipeline(
  params: PromptEngineering.BuildGenerationPayloadParams,
  authorization?: string,
): Promise<PromptEngineering.PromptEngineeringResult> {
  const semantic = await parseSemanticWithLLM(params.userInput, authorization)
  const assets = await retrieveAssetContext(semantic)
  const synthesis = await synthesizePromptWithLLM(semantic, assets, authorization)
  const referenceImages = collectReferenceImages(assets)
  const payload = buildGenerationPayload(params.model, synthesis, referenceImages, params)

  return { semantic, assets, synthesis, payload }
}
