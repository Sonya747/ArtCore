import { message } from 'antd'
import { API } from '@/service'
import type { ASSETS } from '@/service/assets/typing'
import { TaskStatus, TaskType } from '@/service/typing'
import type { Workspace } from '@/service/workspace/typing'
import { downloadFile } from '@/utils/download'
import type { WorkDisplayData } from '../components/work-area/work-display'
import { useNavigate } from '@tanstack/react-router'

/**
 * 跳转到创作详情
 * 逻辑从src/components/task-bar/task-list.tsx handleTaskClick复制过来
 * @param task 任务
 */
export const handleTaskNavigate = (task: Workspace.TaskDetail) => {
  message.info("查看详情")
}

/**
 * 从专辑移除作品
 * @param asset_ids 资产ID数组
 * @param albumId 专辑ID
 * @param workspaceId 工作空间ID
 */
export const removeAssets = async (asset_ids: string[], albumId: string, workspaceId: string) => {
  await API.assets.removeAssetsFromAlbum({
    workspace_id: workspaceId,
    album_id: albumId,
    asset_ids: asset_ids,
  })
}

/**
 * 将选中的作品数据转换为 asset_id 数组
 * 过滤掉 null、undefined 和重复的 asset_id
 * @param items 选中的作品数据列表
 * @returns 去重后的 asset_id 数组
 */
export const selectedItemsToAssetIds = (items: WorkDisplayData[]): string[] => {
  const assetIdSet = new Set<string>()
  items.forEach((item) => {
    // 处理任务包含的 assetIds 数组
    if (Array.isArray(item.assetIds) && item.assetIds.length > 0) {
      item.assetIds.forEach((assetId) => {
        // 过滤掉 null、undefined 和空字符串
        if (assetId && typeof assetId === 'string') {
          assetIdSet.add(assetId)
        }
      })
    }
  })

  return Array.from(assetIdSet)
}

/**
 * 删除资产
 * @param asset_ids 资产ID数组
 */
export const deleteAssets = async (asset_ids: string[]) => {
  await API.assets.deleteAssets({
    asset_ids: asset_ids,
  })
}

/**
 * 删除作品项
 * 根据作品状态和 asset_ids 自动选择调用 deleteTask 或 deleteAssets
 * @param items 要删除的作品数据列表
 */
export const deleteItems = async (items: WorkDisplayData[]) => {
  if (items.length === 0) {
    return
  }

  // 分离需要调用 deleteTask 和 deleteAssets 的 items
  const taskItems: WorkDisplayData[] = []
  const assetItems: WorkDisplayData[] = []

  items.forEach((item) => {
    const hasAssetIds = item?.assetIds && item?.assetIds?.length > 0
    const isFinished = item?.status === TaskStatus.FINISHED

    // status != finished 或者 asset_ids 为空，调用 deleteTask
    if (!isFinished || !hasAssetIds) {
      taskItems.push(item)
    } else {
      // 有 asset_ids 的 item，保持原有删除逻辑
      assetItems.push(item)
    }
  })
  // 调用 deleteTask 删除任务
  if (taskItems.length > 0) {
    const batch_delete_item = taskItems.map((item) => ({
      request_id: item.request_id,
      task_type: item.taskType,
    }))
    await API.workspace.deleteTask({
      request_id: '',
      task_type: TaskType.IMAGE,
      batch_delete_item,
    })
  }

  // 调用 deleteAssets 删除资产
  if (assetItems.length > 0) {
    const assetIds = selectedItemsToAssetIds(assetItems)
    if (assetIds.length > 0) {
      await deleteAssets(assetIds)
    }
  }
}

/**
 * 添加资产到专辑
 * @param asset_ids 资产ID数组
 * @param albumId 专辑ID
 * @param workspaceId 工作空间ID
 */
export const addAssetsToAlbum = async (
  asset_ids: string[],
  album_ids: string[],
) => {
  try {
    await API.assets.addAssetsToAlbum({
      album_ids: album_ids,
      asset_ids: asset_ids,
    })
    message.success('添加到专辑成功')
  } catch (error: any) {
    console.error('添加到专辑失败:', error)
    const errorMessage = error.response?.data?.detail || error.message || '添加到专辑失败'
    message.error(errorMessage)
    throw error
  }
}


/**
 * 下载单个其他任务（图片）
 * 遍历所有URL进行下载，文件名后缀加上序号
 */
export const downloadOtherTask = async (item: WorkDisplayData): Promise<void> => {
  if (!item.urls || item.urls.length === 0) {
    throw new Error(`项目 "${item.title}" 没有可下载的URL`)
  }

  item.urls.forEach((url, index) => {
    downloadFile({
      fileName: `${item.title}_${item.assetIds?.[index] ?? index + 1}`,
      url,
    })
  })
}

/**
 * 将任务数据转换为作品展示数据
 * @param task 创作详情
 * @returns 作品数据
 * assetIds：audio有多个asset_id,其他仅有一个asset_id
 * key: {asset_id}-{request_id},音频为{request_id}
 * key要绝对唯一
 */
export const responseToAsset = (task: ASSETS.TaskDetail): WorkDisplayData[] => {
  switch (task.task_type) {
    case TaskType.IMAGE:
      return (
        (task.result as Workspace.ImageResult)?.images?.map((image, index) => {
          return {
            key: `${image.asset_id}-${task.request_id}`,
            request_id: task.request_id,
            assetIds: [image.asset_id],
            url: image.url, // 下载用的原始URL
            urls: [image.url],
            thumbnail_url: image?.thumbnail_url ?? image.url, // 显示用的缩略图
            taskType: TaskType.IMAGE,
            total: 1,
            title: task.title,
            status: task.status,
            date: task.create_time,
            detail:task // 后续再看
          }
        }) || []
      )
  }
}

/**
 * 将任务数据转换为任务展示数据
 * @param task 创作详情
 * @returns 任务展示数据
 */
export const responseToTasks = (task: ASSETS.TaskDetail): WorkDisplayData => {
  let url: string | undefined
  let thumbnail_url: string | undefined
  let total: number | undefined
  let duration: number | undefined
  let asset_ids: string[] = []
  let urls: string[] = []
  switch (task.task_type) {
    case TaskType.IMAGE:
      {
        const images = (task.result as Workspace.ImageResult)?.images
        total = images?.length ?? 0
        url = images?.[0]?.url // 下载用的原始URL
        thumbnail_url = images?.[0]?.thumbnail_url ?? images?.[0]?.url // 显示用的缩略图
        asset_ids =
          task.status === TaskStatus.FINISHED ? images?.map((image) => image.asset_id) || [] : []
        urls = images?.map((image) => image.url) || []
      }
      break
  }

  return {
    key: task.request_id,
    request_id: task.request_id,
    taskType: task.task_type,
    date: task.create_time,
    title: task.title,
    status: task.status,
    url,
    thumbnail_url,
    total,
    duration,
    assetIds: asset_ids,
    urls,
    isTask: true,
    detail: task,
  }
}
