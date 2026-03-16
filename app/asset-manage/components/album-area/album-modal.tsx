import { useRequest } from 'ahooks'
import { Checkbox, Empty, Form, Input, List, Modal, message, Spin } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FolderIcon from '@/components/folder-icon'
import { PRIMARY_GRADIENT_BUTTON_CLASSNAME } from '@/components/gradient-button'
import IconFont from '@/components/icon-font'
import Search from '@/components/search'
import { cn } from '@/utils/cn'
import { ASSETS } from '@/service/assets/typing'
import { assetsService } from '@/service/assets'

export type AlbumNameModalType = 'create' | 'rename'

export interface AlbumModalProps {
  open: boolean
  type: AlbumNameModalType
  album?: ASSETS.AlbumInfo
  workspaceId: string
  onCancel: () => void
  onSuccess: () => void
  onCreate?: (name: string) => Promise<void>
  onRename?: (albumId: string, name: string) => Promise<void>
}

/**
 * 专辑操作弹窗组件（新建/重命名）
 */
export const AlbumNameModal = ({
  open,
  type,
  album,
  workspaceId,
  onCancel,
  onSuccess,
  onCreate,
  onRename,
}: AlbumModalProps) => {
  const [form] = Form.useForm()

  // 弹窗打开动画完成后设置表单值
  const handleAfterOpenChange = (visible: boolean) => {
    if (visible) {
      if (type === 'rename' && album) {
        form.setFieldsValue({ name: album.name })
      } else {
        form.resetFields()
      }
    }
  }

  /**
   * 检查专辑名称是否重复（调用后端 API）
   */
  const checkAlbumNameDuplicate = async (albumName: string): Promise<boolean> => {
    try {
      const response = await assetsService.getAlbumList({
        workspace_id: workspaceId,
        page: 0,
        page_size: 10,
        keyword: albumName,
      })
      // 检查是否有同名专辑（排除当前编辑的专辑）
      const excludeAlbumId = type === 'rename' && album ? album.album_id : undefined
      return response.results.some((a: { album_id: string | undefined; name: string }) => a.album_id !== excludeAlbumId && a.name === albumName)
    } catch (error) {
      console.error('检查专辑名称失败:', error)
      // 如果检查失败，允许继续（避免因为网络问题阻止用户操作）
      return false
    }
  }

  const handleFinish = async (values: { name: string }) => {
    try {
      if (type === 'create' && onCreate) {
        const albumName = values.name?.trim()
        if (!albumName) {
          message.error('专辑名称不能为空')
          return
        }

        await onCreate(albumName)
        message.success('专辑创建成功')
        onSuccess()
        onCancel()
      } else if (type === 'rename' && album && onRename) {
        const albumName = values.name?.trim()
        if (!albumName) {
          message.error('专辑名称不能为空')
          return
        }

        // 如果名称没有变化，直接返回
        if (albumName === album.name) {
          onCancel()
          return
        }

        await onRename(album.album_id, albumName)
        message.success('专辑重命名成功')
        onSuccess()
        onCancel()
      }
    } catch (error: any) {
      message.error(error?.message || `${type === 'create' ? '创建' : '重命名'}专辑失败`)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const isCreate = type === 'create'
  const title = isCreate ? '新建专辑' : '重命名专辑'

  return (
    <Modal
      open={open}
      title={title}
      okText='提交'
      cancelText='取消'
      okButtonProps={{
        autoFocus: true,
        htmlType: 'submit',
        className: PRIMARY_GRADIENT_BUTTON_CLASSNAME,
      }}
      cancelButtonProps={{
        variant: 'filled',
        color: 'default',
      }}
      onCancel={handleCancel}
      afterOpenChange={handleAfterOpenChange}
      destroyOnHidden
      width={580}
      modalRender={(dom) => (
        <Form
          layout='vertical'
          form={form}
          name='album_form'
          requiredMark={false}
          onFinish={handleFinish}
          clearOnDestroy
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        label={
          <span className='mt-4 font-medium'>
            专辑名称<span className='text-red-500 ml-1'>*</span>
          </span>
        }
        name='name'
        rules={[
          { required: true, message: '请输入专辑名称' },
          { max: 32, message: '专辑名称最多32个字符' },
          {
            validator: async (_, value) => {
              if (!value) return Promise.resolve()
              const trimmedValue = value.trim()
              if (!trimmedValue) {
                return Promise.reject(new Error('专辑名称不能为空'))
              }
              // 调用后端 API 检查是否重名
              const isDuplicate = await checkAlbumNameDuplicate(trimmedValue)
              if (isDuplicate) {
                return Promise.reject(new Error('专辑名称已存在'))
              }
              return Promise.resolve()
            },
            validateTrigger: ['onBlur', 'onSubmit'],
          },
        ]}
      >
        <Input
          placeholder='请输入文件夹名称'
          maxLength={32}
          showCount={{
            formatter: ({ count, maxLength }: { count: number; maxLength?: number }) =>
              `${count} / ${maxLength ?? 32}`,
          }}
        />
      </Form.Item>
    </Modal>
  )
}

export type AlbumViewType = 'list' | 'folder'

export interface AddToAlbumModalProps {
  open: boolean
  workspaceId: string
  existAlbumIds?: string[]
  onCancel: () => void
  onSuccess?: (selectedAlbumIds: string[]) => void
}

// 常量定义
const PAGE_SIZE = 40
const SCROLL_THRESHOLD = 50

/**
 * 高亮文本中的搜索关键词
 */
const highlightText = (text: string, searchKeyword: string) => {
  if (!searchKeyword.trim()) {
    return text
  }

  const escapedKeyword = searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKeyword})`, 'gi')
  const parts = text.split(regex)

  let position = 0
  return parts.map((part) => {
    const currentPosition = position
    position += part.length
    const key = `${part}-${currentPosition}`

    const isMatch = part.toLowerCase() === searchKeyword.toLowerCase()
    if (isMatch) {
      return (
        <span key={key} className='text-red-500'>
          {part}
        </span>
      )
    }
    return <span key={key}>{part}</span>
  })
}

/**
 * 添加到专辑弹窗组件
 * 包含列表视图和文件夹视图两种展示方式
 * 如果之前有选中的专辑，需要传入existAlbumIds
 * onSuccess 回调会返回最终选中的专辑ID列表
 */
export const AddToAlbumModal = ({
  open,
  workspaceId,
  existAlbumIds = [],
  onCancel,
  onSuccess,
}: AddToAlbumModalProps) => {
  const [viewType, setViewType] = useState<AlbumViewType>('folder')
  const [keyword, setKeyword] = useState<string>('')
  const [albums, setAlbums] = useState<ASSETS.AlbumInfo[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  const { loading, run: loadAlbums } = useRequest(
    async (pageNum: number, searchKeyword?: string) => {
      if (!workspaceId) return null
      const response = await assetsService.getAlbumList({
        workspace_id: workspaceId,
        page: pageNum,
        page_size: PAGE_SIZE,
        keyword: searchKeyword || undefined,
      })
      return { response, pageNum }
    },
    {
      manual: true,
      onSuccess: (data) => {
        if (!data) return
        const { response, pageNum } = data
        if (pageNum === 0) {
          setAlbums(response.results)
        } else {
          setAlbums((prev) => [...prev, ...response.results])
        }
        setHasMore(response.results.length === PAGE_SIZE)
        setIsLoadingMore(false)
      },
      onError: () => {
        setIsLoadingMore(false)
        message.error('加载专辑列表失败')
      },
    }
  )

  // 搜索关键词变化时重新加载
  const handleSearch = useCallback(
    (value: string) => {
      setKeyword(value)
      setPage(0)
      setAlbums([])
      setHasMore(true)
      if (workspaceId) {
        loadAlbums(0, value)
      }
    },
    [workspaceId, loadAlbums]
  )

  // 处理选择专辑（多选）
  const handleSelectAlbum = useCallback(
    (albumId: string) => {
      // 如果专辑在 existAlbumIds 中，不允许取消勾选
      if (existAlbumIds.includes(albumId)) {
        return
      }
      setSelectedAlbumIds((prev) =>
        prev.includes(albumId) ? prev.filter((id) => id !== albumId) : [...prev, albumId]
      )
    },
    [existAlbumIds]
  )

  // 处理确认添加（批量添加到多个专辑）
  const handleConfirm = useCallback(() => {
    // 确保 existAlbumIds 中的专辑始终被包含
    const finalAlbumIds = [...new Set([...existAlbumIds, ...selectedAlbumIds])]

    if (finalAlbumIds.length === 0) {
      message.warning('请选择要添加到的专辑')
      return
    }
    onSuccess?.(finalAlbumIds)
  }, [selectedAlbumIds, existAlbumIds, onSuccess])

  // 触底加载更多
  const handleScroll = useCallback(() => {
    const listElement = listRef.current
    if (!listElement) return

    const { scrollTop, scrollHeight, clientHeight } = listElement
    const isNearBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD

    if (isNearBottom && hasMore && !isLoadingMore && !loading) {
      setIsLoadingMore(true)
      const nextPage = page + 1
      setPage(nextPage)
      loadAlbums(nextPage, keyword)
    }
  }, [hasMore, isLoadingMore, loading, page, keyword, loadAlbums])

  // 检查专辑是否已选中
  const isAlbumSelected = useCallback(
    (albumId: string) => selectedAlbumIds.includes(albumId),
    [selectedAlbumIds]
  )

  // 检查专辑是否在 existAlbumIds 中（默认选中且无法取消）
  const isAlbumExist = useCallback(
    (albumId: string) => existAlbumIds.includes(albumId),
    [existAlbumIds]
  )

  // 列表视图渲染项
  const renderListItem = useCallback(
    (album: ASSETS.AlbumInfo) => {
      const isExist = isAlbumExist(album.album_id)
      return (
        <List.Item
          className={cn(
            'py-2!',
            isExist
              ? 'cursor-disabled'
              : 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800'
          )}
          onClick={() => handleSelectAlbum(album.album_id)}
        >
          <div className='flex items-center overflow-hidden text-ellipsis whitespace-nowrap gap-2'>
            <Checkbox checked={isAlbumSelected(album.album_id)} disabled={isExist} />
            {highlightText(album.name, keyword)}
          </div>
        </List.Item>
      )
    },
    [handleSelectAlbum, isAlbumSelected, isAlbumExist, keyword]
  )

  // 文件夹视图渲染项
  const renderFolderItem = useCallback(
    (album: ASSETS.AlbumInfo) => {
      const isExist = isAlbumExist(album.album_id)
      return (
        <div
          className={cn(
            'flex flex-col items-center overflow-hidden p-2 w-full',
            isExist
              ? 'cursor-disabled'
              : 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800'
          )}
          onClick={() => handleSelectAlbum(album.album_id)}
        >
          <FolderIcon coverUrls={album.cover_urls} />
          <div className='w-full min-w-0 px-1 flex items-center justify-center'>
            <Checkbox
              checked={isAlbumSelected(album.album_id)}
              disabled={isExist}
              className='shrink-0'
            />
            <span className='min-w-0 truncate ml-2' title={album.name}>
              {highlightText(album.name, keyword)}
            </span>
          </div>
        </div>
      )
    },
    [handleSelectAlbum, isAlbumSelected, isAlbumExist, keyword]
  )

  // 视图切换按钮配置
  const viewToggleConfig = useMemo(
    () => [
      {
        type: 'folder' as AlbumViewType,
        icon: 'icon-grid',
        onClick: () => setViewType('folder'),
      },
      {
        type: 'list' as AlbumViewType,
        icon: 'icon-list',
        onClick: () => setViewType('list'),
      },
    ],
    []
  )

  // 序列化 existAlbumIds 用于依赖比较，避免数组引用变化导致无限循环
  const existAlbumIdsKey = useMemo(() => JSON.stringify(existAlbumIds), [existAlbumIds])

  // 弹窗打开时初始化，关闭时重置状态
  useEffect(() => {
    if (open && workspaceId) {
      // 设置选中列表
      setSelectedAlbumIds([...existAlbumIds])
      // 重置状态
      setKeyword('')
      setPage(0)
      setAlbums([])
      setHasMore(true)
      setIsLoadingMore(false)
      // 加载数据
      loadAlbums(0, '')
    } else if (!open) {
      // 弹窗关闭时重置状态
      setViewType('folder')
      setKeyword('')
      setPage(0)
      setAlbums([])
      setHasMore(true)
      setIsLoadingMore(false)
      setSelectedAlbumIds([])
    }
  }, [open, workspaceId, existAlbumIdsKey])

  // 滚动事件监听
  useEffect(() => {
    if (!open) return

    const listElement = listRef.current
    if (!listElement) return

    listElement.addEventListener('scroll', handleScroll)
    return () => {
      listElement.removeEventListener('scroll', handleScroll)
    }
  }, [open, handleScroll])

  return (
    <Modal
      open={open}
      title='添加到专辑'
      closeIcon={<IconFont type='icon-close' />}
      okText='确定'
      cancelText='取消'
      okButtonProps={{
        className: PRIMARY_GRADIENT_BUTTON_CLASSNAME,
      }}
      cancelButtonProps={{
        variant: 'filled',
        color: 'default',
      }}
      onCancel={onCancel}
      onOk={handleConfirm}
      width={580}
      destroyOnHidden
    >
      <div className='flex flex-col h-100 pt-5'>
        {/* 搜索和视图切换 */}
        <div className='flex items-center justify-between mb-4 gap-5'>
          <Search placeholder='输入名称搜索' onSearch={handleSearch} allowClear />
          <div className='flex items-center'>
            {viewToggleConfig.map((config, index) => {
              const isActive = viewType === config.type
              return (
                <div
                  key={config.type}
                  onClick={config.onClick}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 cursor-pointer',
                    index === 0 ? 'rounded-l-md' : 'rounded-r-md',
                    isActive ? 'bg-[#E6E8EA] dark:bg-[#494949]' : 'bg-[#F0F2F5] dark:bg-[#303030]'
                  )}
                >
                  <IconFont
                    type={config.icon}
                    className={cn(
                      'text-base',
                      isActive ? 'text-[#404b52] dark:text-[#cdd2d6]' : 'text-assistant-text-color!'
                    )}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* 列表内容 */}
        <div
          ref={listRef}
          className='flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-auto-hide'
        >
          <List
            loading={{
              spinning: loading && page === 0,
              tip: '加载中...',
              style: { marginTop: 50 },
            }}
            dataSource={albums}
            renderItem={viewType === 'list' ? renderListItem : renderFolderItem}
            grid={viewType === 'list' ? undefined : { gutter: [20, 20], column: 3 }}
            split={false}
            locale={{
              emptyText: <Empty description='暂无专辑' />,
            }}
          />

          {/* 加载更多提示 */}
          {isLoadingMore && (
            <div className='flex justify-center items-center py-4'>
              <Spin size='small' />
              <span className='ml-2 text-sm text-gray-500 dark:text-gray-400'>加载中...</span>
            </div>
          )}
          {!hasMore && albums.length > 0 && (
            <div className='text-center py-4 text-sm text-gray-400 dark:text-gray-500'>
              没有更多了
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
