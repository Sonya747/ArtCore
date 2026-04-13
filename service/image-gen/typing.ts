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
