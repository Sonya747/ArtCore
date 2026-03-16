import { Tabs } from 'antd'
import { memo, useCallback } from 'react'
import type { TaskType } from '@/service/typing'

export interface WorkGalleryTabsProps {
  taskType: TaskType | 'all'
  onTaskTypeChange: (taskType: TaskType | 'all') => void
}

/**
 * 作品画廊Tab区域组件
 */
const WorkGalleryTabs = ({ taskType, onTaskTypeChange }: WorkGalleryTabsProps) => {
  const handleChange = useCallback(
    (key: string) => {
      const newTaskType = key === 'all' ? 'all' : (key as TaskType)
      onTaskTypeChange(newTaskType)
    },
    [onTaskTypeChange]
  )

  return (
    <Tabs
      classNames={{
        header: 'border-b-none! shadow-none! before:border-b-0!',
        /** 在某些浏览器上，点击会显示文本插入光标（caret），所以这里写样式禁止文本选择+设置光标透明 */
        item: 'cursor-pointer! py-2! select-none! caret-transparent!',
      }}
      style={{
        borderBottom: 'none! unset!',
      }}
      activeKey={taskType}
      onChange={handleChange}
      items={[
        {
          key: 'all',
          label: '全部',
        },
        {
          key: 'image',
          label: '图片',
        },
        {
          key: 'video',
          label: '视频',
        },
        {
          key: 'audio',
          label: '音频',
        },
      ]}
    />
  )
}

export default memo(WorkGalleryTabs)
