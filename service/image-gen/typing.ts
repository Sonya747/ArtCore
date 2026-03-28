/**
 * 火山方舟 Ark — 图片生成 API（Doubao Seedream 等）
 * @see https://ark.cn-beijing.volces.com/api/v3/images/generations
 */

export namespace DoubaoImageGen {
  export interface GenerationsRequest {
    model: string
    prompt: string
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
