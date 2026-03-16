import { message } from 'antd'
import { create } from 'zustand'
import { useGlobalStore } from '../global'
import type { AlbumStore } from './typing'
import { assetsService } from '@/service/assets'

const DEFAULT_PAGE_SIZE = 7

/**
 * 专辑管理 Store
 */
export const useAlbumStore = create<AlbumStore>((set, get) => ({
  // 初始状态
  albumListData: null,
  loading: false,
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  keyword: '',

  setPage: (page) => {
    set({ page })
    get().fetchAlbumList()
  },

  setKeyword: (keyword) => {
    set({ keyword, page: 0 }) // 搜索时重置到第一页
    get().fetchAlbumList()
  },

  fetchAlbumList: async (workspaceId) => {
    const { page, pageSize, keyword } = get()

    let workspace_id = workspaceId || ''

    if (!workspaceId) {
      workspace_id = useGlobalStore.getState().currentWorkspace?.workspace_id as string
    }

    set({ loading: true })

    try {
      const response = await assetsService.getAlbumList({
        workspace_id,
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
      })
      set({ albumListData: response })
    } catch (error: any) {
      message.error(error?.message || '获取专辑列表失败')
      set({ albumListData: null })
    } finally {
      set({ loading: false })
    }
  },

  refreshAlbumList: (effectAlbumIds) => {
    const { albumListData } = get()
    const hasEffectAlbum = albumListData?.results.some((album) =>
      effectAlbumIds?.includes(album.album_id)
    )

    if (!effectAlbumIds || hasEffectAlbum) {
      get().fetchAlbumList()
    }
  },

  reset: () => {
    set({
      albumListData: null,
      loading: false,
      page: 0,
      keyword: '',
    })
  },
}))
