import type { ASSETS } from '@/service/assets/typing'

/**
 * 专辑 Store 类型定义
 */
export interface AlbumStore {
  // 专辑列表数据
  albumListData: ASSETS.GetAlbumListResponse | null
  // 加载状态
  loading: boolean
  // 分页参数
  page: number
  pageSize: number
  // 搜索关键词
  keyword: string

  /**
   * 设置分页
   */
  setPage: (page: number) => void
  /**
   * 设置搜索关键词
   */
  setKeyword: (keyword: string) => void
  /**
   * 获取专辑列表
   */
  fetchAlbumList: (workspaceId?: string) => Promise<void>
  /**
   * 刷新当前页的专辑列表
   * @param effectAlbumIds 操作专辑后影响专辑 ID 列表，不传默认刷新，传入会判断是否需要刷新
   */
  refreshAlbumList: (effectAlbumIds?: string[]) => void
  /**
   * 重置状态
   */
  reset: () => void
}
