import type { IMAGES } from '../images/typing'
import type { TaskStatus, TaskType } from '../typing'

export namespace Workspace {
  export interface Member {
    user_id: string
    role: string
    created_at: string
    username: string
    email: string
    last_login: string
    is_active: boolean
  }

  export interface Workspace {
    _id: string
    workspace_id: string
    name: string
    description: string
    icon_path: string | null
    created_by: string
    created_at: string
    updated_at: string
    members: Member[]
    libraries: string[]
  }

  export interface CreateWorkspaceParams {
    name: string
    description?: string
    icon_path?: string
  }

  export interface UpdateWorkspaceParams extends Partial<CreateWorkspaceParams> {
    workspace_id: string
  }

  export interface GetWorkspaceParams {
    page?: number
    page_size?: number
  }

  export interface GetWorkspaceResponse {
    page: number
    page_size: number
    total_count: number
    results: Workspace[]
  }

  export interface ManageMemberParams {
    workspace_id: string
    user_id: string
    role: string
  }

  export interface ManageMemberResponse {
    message: string
  }

  export interface DeleteMemberParams {
    workspace_id: string
    user_id: string
  }

  export interface UploadIconParams {
    workspace_id: string
    file: File
  }

  export interface GetWorkspaceTaskListParams {
    workspace_id: string
    page?: number
    page_size?: number
    keyword?: string
    task_type?: string
  }


  export interface ImageRequestData extends IMAGES.GenerateTaskParams {}

  export interface ImageResult {
    images: {
      asset_id: string
      url: string
      thumbnail_url?: string
    }[]
    reference_images: string[]
  }


  export type ImageTaskType = 'generate' | 'edit' | 'comfyui'

  export type VideoTaskType = 'description' | 'frame'

  export interface ImageExtInfo {
    task_type: ImageTaskType
    edit_type?: IMAGES.EditType
    model?: string
  }

  export interface QueueInfo {
    ahead_count?: number
    queue_position?: number
    estimated_wait_minutes?: number
    estimated_wait_seconds?: number
    queue_id: string
    task_type: TaskType
    backend: string
    status: string
    priority: number
    submit_time: number
    wait_time: number
    concurrency_cost: number
  }

  export interface Task {
    request_id: string
    name: string
    status: TaskStatus
    task_type: TaskType
    client_id: string
    request_data: ImageRequestData
    result: ImageResult
    err_msg: string | null
    created_at: string
    updated_at: string
    thumbnail: string
    url: string
    properties: null
    ext_infos: ImageExtInfo | null
    queue_info: QueueInfo | null
  }

  export interface TaskSummary {
    request_id: string
    status: TaskStatus
    task_type: TaskType
    thumbnail: string | null
    name: string
    image_task_type?: ImageTaskType
    video_task_type?: VideoTaskType
  }

  export interface TaskDetail {
    request_id: string
    status: TaskStatus
    task_type: TaskType
    thumbnail?: string | null
    request_data?: ImageRequestData 
    result: ImageResult
    ext_infos?: ImageExtInfo
  }

  export interface GetWorkspaceTaskListResponse {
    has_more: boolean
    page: number
    page_size: number
    total_count: number
    results: TaskSummary[]
  }

  export interface GetWorkspaceTaskStatusResponse {
    has_processing_tasks: boolean
    results: TaskSummary[]
    updated_count: number
  }

  export interface GetTaskByIdParams {
    request_id: string
    task_type: TaskType
    workspace_id: string
  }

  export interface Album {
    album_id: string
    workspace_id: string
    name: string
    cover_urls: string[]
    is_default: boolean
    created_by: string
    created_at: string
    updated_at: string
    last_content_updated_at: string
  }
}
