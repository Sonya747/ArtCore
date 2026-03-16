import type { TaskStatus, TaskType } from '../typing'
import type { Workspace } from '../workspace/typing'

export namespace ASSETS {
  export interface AlbumInfo {
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

  /**
   * 资产管理中使用的任务详情，当前页面只关心图片类型
   * TODO 之后不用继承
   */
  export interface TaskDetail extends Workspace.TaskDetail {
    task_type: TaskType.IMAGE
    status: TaskStatus
    create_time:string
  }

  export interface GetAlbumListParams {
    workspace_id: string
    page: number
    page_size: number
    keyword?: string | null
  }

  export interface GetAlbumListResponse {
    page: number
    page_size: number
    total_count: number
    results: AlbumInfo[]
  }

  export interface CreateAlbumParams {
    workspace_id: string
    name: string
  }

  export interface UpdateAlbumParams {
    workspace_id: string
    album_id: string
    name: string
  }

  export interface DeleteAlbumParams {
    workspace_id: string
    album_id: string
  }

  export interface GetAlbumDetailParams {
    workspace_id: string
    album_id: string
    page: number
    page_size: number
    keyword?: string | null
    task_types?: TaskType[]
  }

  export interface GetTaskDetailListParams {
    workspace_id: string
    page: number
    page_size: number
    keyword?: string
    task_types?: TaskType[]
  }

  export interface TaskListResponse {
    page: number
    page_size: number
    total_count: number
    has_more: boolean
    results: TaskDetail[]
  }

  export interface GetAssetAlbumIdsParams {
    workspace_id: string
    asset_id: string
  }

  export type GetAssetAlbumIdsResponse = string[]

  export interface AddAssetsToAlbumParams {
    album_ids: string[]
    asset_ids: string[]
  }

  export interface RemoveAssetsFromAlbumParams {
    workspace_id: string
    album_id: string
    asset_ids: string[]
  }

  export interface DeleteAssetsParams {
    asset_ids: string[]
  }
}

