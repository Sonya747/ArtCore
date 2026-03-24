export namespace TASKS {
  export type GenerationTaskStatus = 'pending' | 'running' | 'success' | 'failed'

  export interface GenerationTask {
    id: string
    user_id: string
    input_params: Record<string, unknown>
    model_label: string
    workflow_name: string
    status: GenerationTaskStatus
    error_message?: string | null
    created_at: string
    started_at?: string | null
    finished_at?: string | null
  }

  export interface ListGenerationTasksParams {
    user_id: string
    page?: number
    page_size?: number
  }

  export interface ListGenerationTasksResponse {
    page: number
    page_size: number
    total_count: number
    results: GenerationTask[]
  }

  export interface DeleteGenerationTasksParams {
    ids: string[]
  }

  export interface DeleteGenerationTasksResponse {
    message: string
  }
}

