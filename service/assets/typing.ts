import type { TaskStatus, TaskType } from '../typing'
import type { Workspace } from '../workspace/typing'

export namespace ASSETS {
  export interface AlbumInfo {
    album_id: string
    name: string
    cover_urls: string[]
    is_default: boolean
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
    name: string
  }

  export interface UpdateAlbumParams {
    album_id: string
    name: string
  }

  export interface DeleteAlbumParams {
    album_id: string
  }

  export interface GetAlbumDetailParams {
    album_id: string
    page: number
    page_size: number
    keyword?: string | null
    task_types?: TaskType[]
  }

  export interface GetTaskDetailListParams {
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
    asset_id: string
  }

  export type GetAssetAlbumIdsResponse = string[]

  export interface AddAssetsToAlbumParams {
    album_ids: string[]
    asset_ids: string[]
  }

  export interface RemoveAssetsFromAlbumParams {
    album_id: string
    asset_ids: string[]
  }

  export interface DeleteAssetsParams {
    asset_ids: string[]
  }

  /** `assets` 表行（API 返回） */
  export interface AssetRecord {
    id: string
    name: string | null
    type: string | null
    description: string | null
    preview_url: string | null
    created_by: string | null
    created_at: string
  }

  export interface FetchAssetsParams {
    page: number
    page_size: number
    keyword?: string | null
    task_types?: TaskType[]
    album_id?: string | null
    signal?: AbortSignal
  }

  export interface FetchAssetsResponse {
    page: number
    page_size: number
    total_count: number
    has_more: boolean
    results: AssetRecord[]
  }
}

