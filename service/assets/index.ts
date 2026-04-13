import type { ASSETS } from './typing'
import { TaskStatus, TaskType } from '../typing'
import { Workspace } from '../workspace/typing'

const MOCK_ASSET_TYPES = ['character', 'weapon', 'scene', 'style'] as const
const mockDelay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

const requestJson = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const res = await fetch(input, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : res.statusText || '请求失败')
  }
  return data as T
}

const createMockTask = (index: number): ASSETS.TaskDetail => {
  const imageUrl = '/assets/icons/model/midjourney.webp'
  const assetId = `asset_${index + 1}`
  const now = new Date()
  const catalogType = MOCK_ASSET_TYPES[index % MOCK_ASSET_TYPES.length]

  const result: Workspace.ImageResult = {
    images: [
      {
        asset_id: assetId,
        url: imageUrl,
        type: catalogType,
        description: `示例资产说明：第 ${index + 1} 条`,
        created_by: 'mock-user',
        created_at: now.toISOString(),
      },
    ],
    reference_images: [],
  }

  return {
    request_id: `req_${index + 1}`,
    status: TaskStatus.FINISHED,
    task_type: TaskType.IMAGE,
    result,
    title: `示例作品 ${index + 1}`,
    create_time: now.toISOString(),
  } as ASSETS.TaskDetail
}

export const assetsService = {
  async getAlbumList(
    params: ASSETS.GetAlbumListParams
  ): Promise<ASSETS.GetAlbumListResponse> {
    const query = new URLSearchParams({
      page: String(params.page),
      page_size: String(params.page_size),
      ...(params.keyword ? { keyword: params.keyword } : {}),
    })
    return requestJson<ASSETS.GetAlbumListResponse>(`/api/asset-management/tags?${query.toString()}`)
  },

  async createAlbum(params: ASSETS.CreateAlbumParams): Promise<void> {
    await requestJson('/api/asset-management/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  },

  async updateAlbum(params: ASSETS.UpdateAlbumParams): Promise<void> {
    await requestJson('/api/asset-management/tags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  },

  async deleteAlbum(params: ASSETS.DeleteAlbumParams): Promise<void> {
    await requestJson('/api/asset-management/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  },

  async getAlbumDetail(
    params: ASSETS.GetAlbumDetailParams
  ): Promise<ASSETS.TaskListResponse> {
    await mockDelay()
    const tasks = Array.from({ length: 12 }).map((_, idx) =>
      createMockTask(idx + (params.page || 0) * 12)
    )
    return {
      page: params.page,
      page_size: params.page_size,
      total_count: tasks.length,
      has_more: false,
      results: tasks,
    }
  },

  async getTaskDetailList(
    params: ASSETS.GetTaskDetailListParams
  ): Promise<ASSETS.TaskListResponse> {
    await mockDelay()
    const tasks = Array.from({ length: 16 }).map((_, idx) =>
      createMockTask(idx + (params.page || 0) * 16)
    )
    return {
      page: params.page,
      page_size: params.page_size,
      total_count: tasks.length,
      has_more: false,
      results: tasks,
    }
  },

  async getAssetAlbumIds(
    params: ASSETS.GetAssetAlbumIdsParams
  ): Promise<ASSETS.GetAssetAlbumIdsResponse> {
    return requestJson<ASSETS.GetAssetAlbumIdsResponse>('/api/asset-management/asset-tag-mapping/ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  },
  async getAssetTags(params: ASSETS.GetAssetTagsParams): Promise<ASSETS.GetAssetTagsResponse> {
    return requestJson<ASSETS.GetAssetTagsResponse>('/api/asset-management/asset-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  },

  async addAssetsToAlbum(params: ASSETS.AddAssetsToAlbumParams): Promise<void> {
    await requestJson('/api/asset-management/asset-tag-mapping/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  },

  async removeAssetsFromAlbum(
    params: ASSETS.RemoveAssetsFromAlbumParams
  ): Promise<void> {
    await requestJson('/api/asset-management/asset-tag-mapping/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  },

  async deleteAssets(_params: ASSETS.DeleteAssetsParams): Promise<void> {
    // TODO: 后端资产删除接口待接入
  },

  async fetchAssets(params: ASSETS.FetchAssetsParams): Promise<ASSETS.FetchAssetsResponse> {
    const { signal, ...body } = params
    const res = await fetch('/api/asset-management/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof data?.error === 'string' ? data.error : res.statusText || '获取资产失败')
    }
    return data as ASSETS.FetchAssetsResponse
  },
}

