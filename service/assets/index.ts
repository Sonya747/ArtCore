import type { ASSETS } from './typing'

const requestJson = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const res = await fetch(input, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : res.statusText || '请求失败')
  }
  return data as T
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
  ): Promise<ASSETS.FetchAssetsResponse> {
    return this.fetchAssets({
      page: params.page,
      page_size: params.page_size,
      keyword: params.keyword,
      task_types: params.task_types,
      album_id: params.album_id,
    })
  },

  async getTaskDetailList(
    params: ASSETS.GetTaskDetailListParams
  ): Promise<ASSETS.FetchAssetsResponse> {
    return this.fetchAssets({
      page: params.page,
      page_size: params.page_size,
      keyword: params.keyword,
      task_types: params.task_types,
    })
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

  async deleteAssets(params: ASSETS.DeleteAssetsParams): Promise<void> {
    await requestJson('/api/asset-management/assets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
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

