/**
 * 火山方舟 Ark — 图片生成 API（Doubao Seedream 等）
 * @see https://ark.cn-beijing.volces.com/api/v3/images/generations
 */

export namespace DoubaoImageGen {
  export interface GenerationsRequest {
    model: string
    prompt: string
    image?: string | string[]
    sequential_image_generation?: string
    response_format?: string
    size?: string
    stream?: boolean
    watermark?: boolean
  }

  export interface GenerationsDataItem {
    url: string
    size: string
  }

  export interface GenerationsUsage {
    generated_images?: number
    output_tokens?: number
    total_tokens?: number
  }

  export interface GenerationsResponse {
    model: string
    created: number
    data: GenerationsDataItem[]
    usage?: GenerationsUsage
  }
}

/**
 * 火山方舟 Ark — Chat Completions API（豆包等语言模型）
 * @see https://www.volcengine.com/docs/82379/1494384
 */
export namespace ArkChat {
  export interface Message {
    role: "system" | "user" | "assistant"
    content: string
  }

  export interface JsonSchema {
    name: string
    strict?: boolean
    schema: Record<string, unknown>
  }

  export interface ResponseFormat {
    type: "json_schema" | "text"
    json_schema?: JsonSchema
  }

  export interface CompletionsRequest {
    model: string
    messages: Message[]
    response_format?: ResponseFormat
    temperature?: number
    max_tokens?: number
    stream?: boolean
  }

  export interface Choice {
    index: number
    message: Message
    finish_reason: string
  }

  export interface Usage {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }

  export interface CompletionsResponse {
    id: string
    object: string
    created: number
    model: string
    choices: Choice[]
    usage: Usage
  }
}

export namespace PromptEngineering {
  export interface UserInput {
    /** 用户原始自然语言输入 */
    text: string
  }

  export interface SemanticParseResult {
    subject: string | null
    equipment: string | null
    scene: string | null
    style: string | null
  }

  export interface AssetReference {
    id?: string
    keyword: string
    image_url: string | null
    description: string | null
    matched: boolean
  }

  export interface AssetRetrievalResult {
    subject?: AssetReference
    equipment?: AssetReference
    scene?: AssetReference
    style?: AssetReference
  }

  export interface PromptSynthesisResult {
    prompt: string
    /** 供调试或追溯使用 */
    references: string[]
  }

  export interface BuildGenerationPayloadParams {
    userInput: UserInput
    model: string
    size?: string
    response_format?: string
    watermark?: boolean
  }

  export interface PromptEngineeringResult {
    semantic: SemanticParseResult
    assets: AssetRetrievalResult
    synthesis: PromptSynthesisResult
    payload: DoubaoImageGen.GenerationsRequest
  }
}
