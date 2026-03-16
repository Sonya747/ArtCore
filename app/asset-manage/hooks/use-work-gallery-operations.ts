import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { TaskStatus, TaskType } from '@/service/typing'
import type { WorkDisplayData } from '../components/work-area/work-display'
import {
  addAssetsToAlbum,
  deleteItems,
  downloadOtherTask,
  removeAssets,
  selectedItemsToAssetIds,
} from '../utils/assets-operations'
import { useGlobalStore } from '@/store/global'

export interface UseWorkGalleryOperationsReturn {
  selecting: boolean
  selectedItems: WorkDisplayData[]
  handleSelect: (item: WorkDisplayData) => void
  isSelected: (item: WorkDisplayData) => boolean
  handleBatchOperationClick: () => void
  handleCancelSelect: () => void
  handleBatchDownload: () => void
  handleBatchDelete: () => Promise<void>
  handleBatchAddToAlbum: (albumIds: string[]) => Promise<void>
  handleSingleAddToAlbum: (item: WorkDisplayData, albumIds: string[]) => Promise<void>
  handleBatchRemoveFromAlbum: (albumId: string) => Promise<void>
  handleSingleRemoveFromAlbum: (item: WorkDisplayData, albumId: string) => Promise<void>
  handleSingleDownload: (item: WorkDisplayData) => Promise<void>
  handleSingleDelete: (item: WorkDisplayData) => Promise<void>
  isDownloading: boolean
  canBatchDownload: boolean
  canBatchModify: boolean
}

/**
 * 作品画廊操作相关逻辑 Hook
 */
export const useWorkGalleryOperations = (): UseWorkGalleryOperationsReturn => {
  const [selecting, setSelecting] = useState<boolean>(false)
  const [selectedItems, setSelectedItems] = useState<WorkDisplayData[]>([])
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [canBatchDownload, setCanBatchDownload] = useState<boolean>(true) // 选到了非成功生成的任务/作品不能下载
  const [canBatchModify, setCanBatchModify] = useState<boolean>(true) // 选到了非成功生成的任务/作品不能添加到专辑


  // 处理选择
  const handleSelect = useCallback(
    (item: WorkDisplayData) => {
      const isAlreadySelected = selectedItems.some((selected) => selected.key === item.key)
      const newSelectedItems = isAlreadySelected
        ? selectedItems.filter((selected) => selected.key !== item.key)
        : [...selectedItems, item]
      //有非成功生成的任务/作品不能下载和添加到专辑
      if (newSelectedItems.some((selected) => selected.status !== TaskStatus.FINISHED)) {
        setCanBatchDownload(false)
        setCanBatchModify(false)
      } else {
        setCanBatchDownload(true)
        setCanBatchModify(true)
      }
      setSelectedItems(newSelectedItems)
    },
    [selectedItems]
  )

  // 检查是否选中
  const isSelected = useCallback(
    (item: WorkDisplayData) => {
      return selectedItems.some((selected) => selected.key === item.key)
    },
    [selectedItems]
  )

  // 处理批量操作按钮点击
  const handleBatchOperationClick = useCallback(() => {
    setSelecting(true)
  }, [])

  // 处理取消选择
  const handleCancelSelect = useCallback(() => {
    setSelecting(false)
    setSelectedItems([])
  }, [])

  // 处理批量下载
  const handleBatchDownload = useCallback(async () => {
    if (isDownloading) {
      message.warning('当前有下载任务进行中')
      return
    }
    if (selectedItems.length === 0) {
      message.warning('请先选择要下载的项目')
      return
    }


    try {
      setIsDownloading(true)

      // 处理其他任务下载（图片、视频、聊天等）
      for (const item of selectedItems) {
        try {
          await downloadOtherTask(item)
        } catch (error: any) {
          console.error('下载文件失败:', error)
          message.error(`下载 "${item.title}" 失败: ${error.message || '未知错误'}`)
        }
      }
      handleCancelSelect()
    } catch (error: any) {
      console.error('批量下载失败:', error)
      message.error(`批量下载失败: ${error.message || '未知错误'}`)
    } finally {
      setIsDownloading(false)
    }
  }, [selectedItems, isDownloading, handleCancelSelect])

  // 处理单个item下载
  const handleSingleDownload = useCallback(
    async (item: WorkDisplayData) => {
      if (isDownloading) {
        message.warning('当前有下载任务进行中')
        return
      }

      try {
        setIsDownloading(true)


        // 处理其他任务下载（图片、视频、聊天等）
        try {
          await downloadOtherTask(item)
        } catch (error: any) {
          console.error('下载文件失败:', error)
          message.error(`下载 "${item.title}" 失败: ${error.message || '未知错误'}`)
          throw error
        }
      } finally {
        setIsDownloading(false)
      }
    }, [isDownloading, selectedItems])

  // 处理批量添加到专辑
  const handleBatchAddToAlbum = useCallback(
    async (albumIds: string[]) => {
      const assetIds = selectedItemsToAssetIds(selectedItems)
      if (assetIds.length === 0) {
        message.warning('所选项目中没有可添加到专辑的资产')
        return
      }
      await addAssetsToAlbum(assetIds, albumIds)
      handleCancelSelect()
    },
    [selectedItems, handleCancelSelect]
  )

  // 处理单个添加到专辑
  const handleSingleAddToAlbum = useCallback(
    async (item: WorkDisplayData, albumIds: string[]) => {
      // 获取 asset_ids
      const assetIds = item.assetIds ?? []
      if (assetIds.length === 0) {
        message.warning(`项目 "${item.title}" 没有可添加到专辑的资产`)
        return
      }
      await addAssetsToAlbum(assetIds, albumIds)
    },
    []
  )

  // 从专辑批量移除资产
  const handleBatchRemoveFromAlbum = useCallback(
    async (albumId: string) => {
      if (selectedItems.length === 0) {
        message.warning('请先选择要移除的资产')
        return
      }
      const assetIds = selectedItemsToAssetIds(selectedItems)
      if (assetIds.length === 0) {
        message.warning('所选项目中没有可移除的资产')
        return
      }
      await removeAssets(assetIds, albumId, useGlobalStore.getState().currentWorkspace?.workspace_id ?? '')
      handleCancelSelect()
    },
    [selectedItems, handleCancelSelect]
  )

  // 从专辑单个移除资产
  const handleSingleRemoveFromAlbum = useCallback(
    async (item: WorkDisplayData, albumId: string) => {
      // 获取 asset_ids
      const assetIds = item.assetIds ?? []
      if (assetIds.length === 0) {
        message.warning(`项目 "${item.title}" 没有可移除的资产`)
        return
      }
      await removeAssets(assetIds, albumId, useGlobalStore.getState().currentWorkspace?.workspace_id ?? '')
    },
    []
  )
  // 处理批量删除
  const handleBatchDelete = useCallback(async () => {
    await deleteItems(selectedItems)
  }, [selectedItems])

  // 处理单个删除
  const handleSingleDelete = useCallback(async (item: WorkDisplayData) => {
    await deleteItems([item])
  }, [])


  return {
    selecting,
    selectedItems,
    handleSelect,
    isSelected,
    handleBatchOperationClick,
    handleCancelSelect,
    handleBatchDownload,
    handleBatchDelete,
    handleBatchAddToAlbum,
    handleSingleAddToAlbum,
    handleBatchRemoveFromAlbum,
    handleSingleRemoveFromAlbum,
    handleSingleDownload,
    handleSingleDelete,
    isDownloading,
    canBatchDownload,
    canBatchModify,
  }
}
