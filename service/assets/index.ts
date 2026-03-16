import type { ASSETS } from './typing'
import { TaskStatus, TaskType } from '../typing'
import { Workspace } from '../workspace/typing'

const mockDelay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

// 一组固定的 mock 图片，用于专辑封面和作品展示
const MOCK_IMAGE_URLS = [
  '/assets/icons/model/midjourney.webp',
  '/assets/icons/model/banana.webp',
  '/assets/icons/model/veo.webp',
  '/assets/icons/model/vidu.webp',
]

const createMockTask = (index: number): ASSETS.TaskDetail => {
  const imageUrl = MOCK_IMAGE_URLS[index % MOCK_IMAGE_URLS.length]
  const assetId = `asset_${index + 1}`
  const now = new Date()

  const result: Workspace.ImageResult = {
    images: [
      {
        asset_id: assetId,
        url: imageUrl,
        thumbnail_url: imageUrl,
      },
    ],
    reference_images: [],
  }

  return {
    request_id: `req_${index + 1}`,
    status: TaskStatus.FINISHED,
    task_type: TaskType.IMAGE,
    result,
    created_at: now.toISOString(),
    name: `示例作品 ${index + 1}`,
  } as ASSETS.TaskDetail
}

const mockAlbums: ASSETS.AlbumInfo[] = Array.from({ length: 6 }).map((_, idx) => {
  const now = new Date().toISOString()
  return {
    album_id: `album_${idx + 1}`,
    workspace_id: 'mock-workspace',
    name: ['赛博朋克', '赛博朋克·夜城', '未来城市', '抽象艺术', '人物肖像', '风景'][idx] ?? `专辑 ${idx + 1}`,
    cover_urls: [MOCK_IMAGE_URLS[idx % MOCK_IMAGE_URLS.length]],
    is_default: idx === 0,
    created_by: 'mock-user',
    created_at: now,
    updated_at: now,
    last_content_updated_at: now,
  }
})

export const assetsService = {
  async getAlbumList(
    params: ASSETS.GetAlbumListParams
  ): Promise<ASSETS.GetAlbumListResponse> {
    await mockDelay()
    const keyword = params.keyword?.trim()
    const filtered = keyword
      ? mockAlbums.filter((item) => item.name.includes(keyword))
      : mockAlbums
    return {
      page: params.page,
      page_size: params.page_size,
      total_count: filtered.length,
      results: filtered,
    }
  },

  async createAlbum(_params: ASSETS.CreateAlbumParams): Promise<void> {
    await mockDelay()
  },

  async updateAlbum(_params: ASSETS.UpdateAlbumParams): Promise<void> {
    await mockDelay()
  },

  async deleteAlbum(_params: ASSETS.DeleteAlbumParams): Promise<void> {
    await mockDelay()
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
    _params: ASSETS.GetAssetAlbumIdsParams
  ): Promise<ASSETS.GetAssetAlbumIdsResponse> {
    await mockDelay()
    // 默认返回前两个专辑 ID
    return mockAlbums.slice(0, 2).map((item) => item.album_id)
  },

  async addAssetsToAlbum(_params: ASSETS.AddAssetsToAlbumParams): Promise<void> {
    await mockDelay()
  },

  async removeAssetsFromAlbum(
    _params: ASSETS.RemoveAssetsFromAlbumParams
  ): Promise<void> {
    await mockDelay()
  },

  async deleteAssets(_params: ASSETS.DeleteAssetsParams): Promise<void> {
    await mockDelay()
  },
}

