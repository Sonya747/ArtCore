import { App, type MenuProps, Spin } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import EmptyAssets from '@/assets/images/empty-asset.svg'
import { PRIMARY_GRADIENT_BUTTON_CLASSNAME } from '@/components/gradient-button'
import { useScrollPagination } from '@/hooks/use-scroll-page'
import { API } from '@/service'
import { TaskStatus, TaskType } from '@/service/typing'
import { useAlbumStore } from '@/store/album'
import { useGlobalStore } from '@/store/global'
import { useWorkGalleryOperations } from '../../hooks/use-work-gallery-operations'
import { handleTaskNavigate, responseToAsset, responseToTasks } from '../../utils/assets-operations'
import { AddToAlbumModal } from '../album-area/album-modal'
import WorkDisplay, { type WorkDisplayData } from './work-display'
import WorkGalleryHeader from './work-gallery-header'
import WorkGalleryTabs from './work-gallery-tabs'

interface WorkGalleryProps {
  albumId?: string
  containerRef?: React.RefObject<HTMLDivElement | null>
}

const WorkGallery = ({ albumId, containerRef }: WorkGalleryProps) => {
  const currentWorkspace = useGlobalStore(useShallow((state) => state.currentWorkspace))
  const workspaceId = currentWorkspace?.workspace_id
  const [taskType, setTaskType] = useState<TaskType | 'all'>('all')
  const [keyword, setKeyword] = useState<string | undefined>(undefined)
  const [groupByTask, setGroupByTask] = useState<boolean>(false)
  const [openAddToAlbumModal, setOpenAddToAlbumModal] = useState<boolean>(false)
  const [operatingItem, setOperatingItem] = useState<WorkDisplayData | undefined>(undefined) //当前操作的单个item
  const [existAlbumIds, setExistAlbumIds] = useState<string[]>([]) // 资产已存在的专辑ID列表
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set()) // 不显示的项目 key，用于删除/移除操作后不显示项目（但不重新请求数据）
  const { modal, message } = App.useApp()

  // 操作相关逻辑
  const {
    selecting,
    selectedItems,
    handleSelect,
    isSelected,
    handleBatchOperationClick,
    handleCancelSelect,
    handleBatchDownload,
    handleBatchDelete,
    handleSingleDownload,
    canBatchDownload,
    canBatchModify,
    handleBatchAddToAlbum,
    handleSingleAddToAlbum,
    handleSingleDelete,
    handleBatchRemoveFromAlbum,
    handleSingleRemoveFromAlbum,
  } = useWorkGalleryOperations()

  const fetchTasks = useCallback(
    async (page: number, pageSize: number, signal?: AbortSignal) => {
      if (!workspaceId) return Promise.resolve({ list: [], total: 0, hasMore: false })

      // 如果有 albumId，调用 getAlbumDetail
      if (albumId) {
        return await API.assets
          .getAlbumDetail(
            {
              workspace_id: workspaceId,
              album_id: albumId,
              page,
              page_size: pageSize,
              keyword: keyword || null,
              task_types:
                taskType === 'all'
                  ? undefined
                  : taskType === TaskType.IMAGE
                    ? [TaskType.IMAGE, TaskType.CHAT]
                    : [taskType],
            },
          )
          .then((res) => {
            return { list: res.results || [], total: res.total_count || 0, hasMore: res?.has_more }
          })
          .catch((err) => {
            // 忽略取消请求的错误
            if (err.name === 'CanceledError' || err.name === 'AbortError') {
              return { list: [], total: 0, hasMore: false }
            }
            message.error(err.message || '获取专辑详情失败')
            console.error('getAlbumDetail', err)
            return { list: [], total: 0, hasMore: false }
          })
      }

      // 否则调用 getTaskDetailList
      return await API.assets
        .getTaskDetailList(
          {
            workspace_id: workspaceId,
            page,
            page_size: pageSize,
            task_types:
              taskType === 'all'
                ? undefined
                : taskType === TaskType.IMAGE
                  ? [TaskType.IMAGE, TaskType.CHAT]
                  : [taskType],
            keyword,
          }        )
        .then((res) => {
          return {
            list: res.results || [],
            total: res.total_count || 0,
            hasMore: res.has_more,
          }
        })
        .catch((err) => {
          // 忽略取消请求的错误
          if (err.name === 'CanceledError' || err.name === 'AbortError') {
            return { list: [], total: 0, hasMore: false }
          }
          message.error(err.message || '获取任务列表失败')
          console.error('getTaskDetailList', err)
          return { list: [], total: 0, hasMore: false }
        })
    },
    [workspaceId, albumId, taskType, keyword]
  )

  const handleOpenDeleteConfirmModal = (item?: WorkDisplayData) => {
    const targetItem = item ?? operatingItem
    modal.confirm({
      title: selecting ? '批量删除' : '删除作品',
      content: '是否删除作品？删除后不可恢复',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          if (selecting) {
            await handleBatchDelete()
            handleCancelSelect()
          } else {
            await handleSingleDelete(targetItem as WorkDisplayData)
            setOperatingItem(undefined)
          }
          const deletedItems = selecting ? selectedItems : [targetItem].filter(Boolean)
          // 将被删除项目的 key 添加到 deletedKeys
          setDeletedKeys((prev) => {
            const newSet = new Set(prev)
            deletedItems.map((item) => item?.key && newSet.add(item.key))
            return newSet
          })
          message.success('删除成功')
          useAlbumStore.getState().refreshAlbumList()
        } catch (error: any) {
          console.log('删除失败:', error, error.message)
          // message.error('删除失败:', error.message)
        }
      },
      onCancel: () => {
        setOperatingItem(undefined)
      },
      okButtonProps: {
        className: PRIMARY_GRADIENT_BUTTON_CLASSNAME,
      },
      cancelButtonProps: {
        variant: 'filled',
        color: 'default',
      },
    })
  }

  const handleOpenRemoveConfirmModal = (item?: WorkDisplayData) => {
    const targetItem = item ?? operatingItem
    modal.confirm({
      title: selecting ? '批量移除' : '移除作品',
      content: '是否将作品从专辑移除？移除后，作品仍可在空间资产查看',
      okText: '确认移除',
      cancelText: '取消',
      onOk: async () => {
        try {
          if (selecting) {
            await handleBatchRemoveFromAlbum(albumId ?? '')
            handleCancelSelect()
          } else {
            await handleSingleRemoveFromAlbum(targetItem as WorkDisplayData, albumId ?? '')
            setOperatingItem(undefined)
          }
          const removedItems = selecting ? selectedItems : [targetItem].filter(Boolean)
          // 移除项目的 key 添加到 deletedKeys
          setDeletedKeys((prev) => {
            const newSet = new Set(prev)
            removedItems.map((item) => item?.key && newSet.add(item.key))
            return newSet
          })
          message.success('从专辑移除成功')
        } catch (error: any) {
          message.error('从专辑移除失败:', error.message)
        }
      },
      onCancel: () => {
        setOperatingItem(undefined)
      },
      okButtonProps: {
        className: PRIMARY_GRADIENT_BUTTON_CLASSNAME,
      },
      cancelButtonProps: {
        variant: 'filled',
        color: 'default',
      },
    })
  }

  //TODO 这里的逻辑要捋一下
  const paginationDeps = useMemo(
    () => [workspaceId, albumId, taskType, keyword],
    [workspaceId, albumId, taskType, keyword]
  )

  const { data, loading } = useScrollPagination({
    fetchPage: fetchTasks,
    pageSize: 20,
    threshold: 400,
    enabled: true,
    manual: false,
    deps: paginationDeps,
    containerRef,
  })
  // 当分页依赖变化时，重置已删除项目集合
  useEffect(() => {
    setDeletedKeys(new Set())
  }, [paginationDeps])

  const assets = useMemo(() => {
    return data?.flatMap(responseToAsset) || []
  }, [data])

  const tasks = useMemo(() => {
    return data?.map(responseToTasks) || []
  }, [data])

  const displayItems = useMemo(() => {
    // return (groupByTask ? tasks : assets).filter(
    //   (item) =>
    //     // 过滤掉已删除的项目
    //     !deletedKeys.has(item.key ?? '') &&
    //     // 过滤掉已完成的任务且没有asset_ids的任务
    //     !(item.status === TaskStatus.FINISHED && (item.assetIds ?? []).length === 0)
    // )
    return assets
  }, [groupByTask, tasks, assets, deletedKeys])

  // 处理任务类型切换
  const handleTabChange = (newTaskType: TaskType | 'all') => {
    setTaskType(newTaskType)
  }

  //处理移动到专辑操作
  const handleMoveSuccess = async (selecting: boolean, albumIds: string[]) => {
    setOpenAddToAlbumModal(false)
    if (selecting) {
      await handleBatchAddToAlbum(albumIds)
    } else {
      await handleSingleAddToAlbum(operatingItem as WorkDisplayData, albumIds)
    }
    setOperatingItem(undefined)
    useAlbumStore.getState().refreshAlbumList()
  }

  const getActionItems = (asset: WorkDisplayData): MenuProps['items'] => {
    if (asset.status !== TaskStatus.FINISHED) {
      return [
        {
          key: 'delete',
          label: '删除',
          onClick: () => {
            setOperatingItem(asset)
            handleOpenDeleteConfirmModal(asset)
          },
        },
      ]
    }
    if (!albumId) {
      return [
        {
          key: 'download',
          label: '下载',
          onClick: () => {
            handleSingleDownload(asset)
          },
        },
        {
          key: 'add-to-album',
          label: '添加到专辑',
          onClick: async () => {
            setOperatingItem(asset)
            // 查询资产对应的专辑ID列表
            if (asset.assetIds?.[0]) {
              try {
                const albumIds = await API.assets.getAssetAlbumIds({
                  workspace_id: workspaceId ?? '',
                  asset_id: asset.assetIds[0],
                })
                setExistAlbumIds(albumIds)
              } catch (error) {
                console.error('查询资产专辑ID失败:', error)
                // 查询失败时，设置为空数组，不影响弹窗打开
                setExistAlbumIds([])
              }
            } else {
              setExistAlbumIds([])
            }
            setOpenAddToAlbumModal(true)
          },
        },
        {
          key: 'delete',
          label: '删除',
          onClick: () => {
            setOperatingItem(asset)
            handleOpenDeleteConfirmModal(asset)
          },
        },
      ]
    }
    return [
      {
        key: 'download',
        label: '下载',
        onClick: () => {
          handleSingleDownload(asset)
        },
      },
      {
        key: 'remove-from-album',
        label: '移除',
        onClick: () => {
          setOperatingItem(asset)
          handleOpenRemoveConfirmModal(asset)
        },
      },
    ]
  }

  return (
    <>
      <div
        ref={containerRef}
        className='flex flex-col flex-1 min-w-0 rounded-lg bg-card-bg-color shadow-sm '
      >
        <div className='sticky top-0 z-20 bg-card-bg-color px-6 pt-4 rounded-lg'>
          <WorkGalleryHeader
            onSearch={setKeyword}
            groupByTask={groupByTask}
            selecting={selecting}
            selectedCount={selectedItems.length}
            onGroupByTaskChange={setGroupByTask}
            onBatchOperationClick={handleBatchOperationClick}
            onCancelSelect={handleCancelSelect}
            onBatchDownload={handleBatchDownload}
            onBatchDelete={handleOpenDeleteConfirmModal}
            onBatchModify={async () => {
              if (
                selectedItems.length === 1 &&
                (selectedItems[0].assetIds?.length === 1 ||
                  selectedItems[0].taskType === TaskType.AUDIO)
              ) {
                const albumIds = await API.assets.getAssetAlbumIds({
                  workspace_id: workspaceId ?? '',
                  asset_id: selectedItems[0].assetIds?.[0] ?? '',
                })
                setExistAlbumIds(albumIds)
              }
              setOpenAddToAlbumModal(true)
            }}
            canDownload={canBatchDownload}
            canModify={canBatchModify}
            onBatchRemoveFromAlbum={handleOpenRemoveConfirmModal}
            albumId={albumId}
          />
          <WorkGalleryTabs taskType={taskType} onTaskTypeChange={handleTabChange} />
        </div>
        {/* 首次加载时显示全屏 loading */}
        {loading && !displayItems?.length ? (
          <div className='flex-1 w-full h-full flex items-center justify-center'>
            <Spin />
          </div>
        ) : !displayItems?.length ? (
          <div className='flex-1 w-full h-full flex items-center justify-center flex-col gap-2'>
            <EmptyAssets aria-label='暂无作品' />
            <p className='text-sm text-gray-500'>专辑暂无作品</p>
          </div>
        ) : (
          <div
            className='grid gap-3.5 px-6 py-4 flex-1 w-full h-full content-start'
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            }}
          >
            {displayItems.map((item: WorkDisplayData) => (
              <WorkDisplay
                key={item.key}
                data={item}
                selected={isSelected(item)}
                selectable={selecting}
                onSelect={handleSelect}
                onClick={() => handleTaskNavigate(item.detail)}
                actionItems={getActionItems(item)}
              />
            ))}
            {loading &&
              Array.from({ length: 20 }).map((_, index) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: 骨架屏无需唯一key
                  key={`loading-${index}`}
                  className='aspect-3/4 h-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse'
                />
              ))}
          </div>
        )}
      </div>
      <AddToAlbumModal
        open={openAddToAlbumModal}
        workspaceId={workspaceId ?? ''}
        existAlbumIds={existAlbumIds}
        onCancel={() => {
          setOpenAddToAlbumModal(false)
          setExistAlbumIds([])
        }}
        onSuccess={(ids) => {
          handleMoveSuccess(selecting, ids ?? [])
          setExistAlbumIds([])
        }}
      />
    </>
  )
}

export default WorkGallery
