export namespace TASKS {
  export type GenerationTaskStatus = 'pending' | 'processing' | 'success' | 'failed'

  export interface GenerationTask {
    id: string
    user_id: string | null
    raw_prompt: string
    final_prompt: string | null
    model_name: string | null
    status: GenerationTaskStatus
    image_size: string | null
    request_params: Record<string, unknown> | null
    error_message: string | null
    created_at: string
    finished_at: string | null
  }

  export interface ListGenerationTasksParams {
    page?: number
    page_size?: number
    status?: GenerationTaskStatus
  }

  export interface ListGenerationTasksResponse {
    page: number
    page_size: number
    total_count: number
    results: GenerationTask[]
  }

  export interface CreateGenerationTaskParams {
    raw_prompt: string
    final_prompt?: string | null
    model_name?: string | null
    status: GenerationTaskStatus
    image_size?: string | null
    request_params?: Record<string, unknown> | null
    error_message?: string | null
  }

  export interface CreateGenerationTaskResponse {
    id: string
  }

  export interface DeleteGenerationTasksParams {
    ids: string[]
  }

  export interface DeleteGenerationTasksResponse {
    message: string
  }
}
