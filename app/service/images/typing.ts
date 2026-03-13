import { Workspace } from "../workspace/typing"

export namespace IMAGES {
    export type EditType = 'free' | 'expand' | 'upscale' | 'matting' | 'inpaint'
    export interface PipelineInputNode {
        node_id: number
        input_type: 'int' | 'float' | 'image' | 'text' | 'lora'
        name: string
        description: string
        default_value?: string | number | boolean
        required: boolean
        /** 蒙版图片关联的node_id（如果有） */
        mask_image?: number
        /** lora默认权重值 */
        strength_default_value?: string
        /** lora可选值列表 */
        choices?: string[]
    }

    export interface PipelineOutputNode {
        node_id: number
        output_field: 'images[0]' | 'text'
        output_type: 'image' | 'text'
        name: string
        description: string
    }

    export interface Pipeline {
        name: string
        id: string
        type: 'comfyui'
        description: string
        inputs: PipelineInputNode[]
        outputs: PipelineOutputNode[]
    }

    export type GetPipelineListResponse = Pipeline[]

    export interface ImageData {
        data: string // base64
        type: 'image' | 'mask' | 'first_frame' | 'last_frame'
        image_type?: string // 图片样式
    }

    export interface GenerateTaskParams {
        backend: string
        pipeline_id: string
        params: {
            name: string
            prompt: string
            negative_prompt?: string
            n: number
            size?: string // gpt4O模型使用
            aspect_ratio?: string // 其他模型使用
            image_size?: '1K' | '2K' | '4K' // 分辨率
            model?: string //有些时候要传
            model_version?: string //有些时候要传
            quality?: string
            reference_images?: ImageData[]
            is_group_generation?: boolean
        }
        workspace_id: string
        ext_infos: Workspace.ImageExtInfo
    }
}
