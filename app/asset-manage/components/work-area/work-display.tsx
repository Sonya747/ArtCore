import type { MenuProps } from 'antd'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import DisplayCard from '@/components/display-card'
import { SECONDARY_GRADIENT_BUTTON_CLASSNAME } from '@/components/gradient-button'
import IconFont from '@/components/icon-font'
import { TaskStatus, TaskType } from '@/service/typing'
import type { Workspace } from '@/service/workspace/typing'
import { cn } from '@/utils/cn'

export interface WorkDisplayData {
  request_id: string
  url?: string // 原始URL吗，非缩略
  thumbnail_url?: string // 显示用的缩略图URL
  taskType: TaskType
  status: TaskStatus
  date: string
  title: string
  total?: number
  duration?: number // 视频时长
  key?: string
  isTask?: boolean // 是否为任务
  assetIds?: string[] // 任务包含作品asset_id列表
  urls?: string[] // 任务下载用的URL列表
  detail: Workspace.TaskDetail // 原始完整任务数据
}

export interface WorkDisplayProps {
  data: WorkDisplayData
  selected?: boolean
  selectable?: boolean
  /** 宽高比，默认为 3/4 */
  aspectRatio?: number
  onSelect?: (data: WorkDisplayData) => void
  onClick?: (data: WorkDisplayData) => void
  actionItems?: MenuProps['items']
}

const WorkDisplay = ({
  data,
  selected = false,
  selectable = false,
  aspectRatio = 3 / 4,
  onSelect,
  onClick,
  actionItems = [],
}: WorkDisplayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [imageError, setImageError] = useState(false)

  const handleMouseEnter = useCallback(() => {
    const videoUrl = data.url ?? data.thumbnail_url
    if (data.taskType === TaskType.VIDEO && videoRef.current && videoUrl) {
      // 延迟加载视频源（仅在悬停时加载）
      if (!videoRef.current.src) {
        videoRef.current.src = videoUrl
      }
      videoRef.current.play().catch((error) => {
        console.error('视频播放失败:', error)
      })
    }
  }, [data.taskType, data.url, data.thumbnail_url])

  const handleMouseLeave = useCallback(() => {
    if (data.taskType === TaskType.VIDEO && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [data.taskType])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const getCover = useMemo(() => {
    const { status, taskType } = data

    if (status === TaskStatus.PROCESSING || status === TaskStatus.PENDING) {
      return (
        <div className='w-full h-full bg-[#F0F2F5] dark:bg-[#1F1F1F] flex items-center justify-center gap-4 flex-col'>
          <IconFont type='icon-hourglass' className='text-[#889096]! text-[48px]!' />
          <span className='font-medium text-sm text-[#889096]'>处理中</span>
        </div>
      )
    }

    if (status === TaskStatus.FAILED) {
      return (
        <div className='w-full h-full bg-[#F0F2F5] dark:bg-[#2C363D] flex items-center justify-center gap-4 flex-col'>
          <IconFont type='icon-warning2' className='text-[#FF4D4F]! text-[48px]' />
          <span className='font-medium text-sm text-[#889096]'>失败</span>
        </div>
      )
    }

    if (taskType === TaskType.IMAGE || taskType === TaskType.CHAT) {
      const displayUrl = data.thumbnail_url ?? data.url
      if (!displayUrl || imageError) {
        return (
          <div className='w-full h-full bg-[#F0F2F5] dark:bg-[#2C363D] flex items-center justify-center'>
            <IconFont type='icon-image' className='text-[#889096]! text-[48px]!' />
          </div>
        )
      }

      return (
        <img
          src={displayUrl}
          alt={data.title}
          className='w-full h-full object-cover'
          loading='lazy'
          onError={handleImageError}
          decoding='async'
          fetchPriority='high'
        />
      )
    }

    if (taskType === TaskType.VIDEO) {
      const displayUrl = data.thumbnail_url ?? data.url
      if (!displayUrl) {
        return (
          <div className='w-full h-full bg-[#F0F2F5] dark:bg-[#1F1F1F] flex items-center justify-center'>
            <IconFont type='icon-video' className='text-[#889096]! text-[48px]!' />
          </div>
        )
      }

      const videoUrl = data.url ?? data.thumbnail_url
      return (
        <video
          ref={videoRef}
          className='w-full h-full object-cover'
          loop
          muted
          preload='metadata'
          playsInline
          src={videoUrl}
        >
          您的浏览器不支持视频播放
        </video>
      )
    }

    if (taskType === TaskType.AUDIO) {
      return (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center',
            SECONDARY_GRADIENT_BUTTON_CLASSNAME,
            'bg-linear-to-t! dark:bg-linear-to-t!'
          )}
        >
          <IconFont type='icon-sound' className='text-[#C163FB]! text-[64px]!' />
        </div>
      )
    }

    return null
  }, [
    data.status,
    data.taskType,
    data.title,
    data.url,
    data.thumbnail_url,
    imageError,
    handleImageError,
  ])

  const getTypeIcon = useMemo(() => {
    switch (data.taskType) {
      case TaskType.IMAGE:
        return <IconFont type='icon-image' className='text-white! text-base' />
      case TaskType.CHAT:
        return <IconFont type='icon-chat' className='text-white! text-base' />
      case TaskType.VIDEO:
        return <IconFont type='icon-video' className='text-white! text-base' />
      case TaskType.AUDIO:
        return <IconFont type='icon-audio' className='text-white! text-base' />
      default:
        return null
    }
  }, [data.taskType])

  // 作品个数：仅开启按任务堆叠，且一个任务包含多个作品时出现
  const getTotalText = useMemo(() => {
    if (data.taskType === TaskType.VIDEO && data.status === TaskStatus.FINISHED && data.duration) {
      return data.total && data.total > 1
        ? `${data.duration}s | ${data.total}个`
        : `${data.duration}s`
    }
    if (data.total && data.total > 1) {
      return `${data.total}张`
    }
    return ''
  }, [data.taskType, data.status, data.duration, data.total])

  // 格式化日期
  const formatDate = useMemo(() => {
    try {
      const date = new Date(data.date)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return data.date
    }
  }, [data.date])

  const titleContent = useMemo(
    () => (
      <div className='flex items-center gap-1 max-w-full'>
        <div className='shrink-0 w-4 h-4 flex items-center justify-center'>{getTypeIcon}</div>
        <div className='flex-1 min-w-0'>
          <p
            className='text-sm font-medium text-white leading-[22px] overflow-hidden text-ellipsis whitespace-nowrap'
            title={data.title}
          >
            {data.title}
          </p>
        </div>
      </div>
    ),
    [getTypeIcon, data.title]
  )

  const handleSelect = useCallback(() => {
    onSelect?.(data)
  }, [onSelect, data])

  const handleCardClick = useCallback(() => {
    onClick?.(data)
  }, [onClick, data])

  return (
    <DisplayCard
      aspectRatio={aspectRatio}
      cover={getCover}
      hoverScale={data.taskType !== TaskType.VIDEO}
      selected={selected}
      selectable={selectable}
      actions={actionItems}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={titleContent}
      description={formatDate}
      avatar={getTotalText}
      onSelect={onSelect ? handleSelect : undefined}
      onClick={onClick ? handleCardClick : undefined}
      className='cursor-pointer'
    />
  )
}

export default memo(WorkDisplay)
