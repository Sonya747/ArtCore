import { Button } from 'antd'
import { memo } from 'react'

export interface WorkGallerySelectionBarProps {
  selectedCount: number
  onBatchDownload: () => void
  onBatchDelete: () => void
}

/**
 * 作品画廊选择模式操作栏组件
 */
const WorkGallerySelectionBar = ({
  selectedCount,
  onBatchDownload,
  onBatchDelete,
}: WorkGallerySelectionBarProps) => {
  return (
    <div className='flex items-center justify-between w-full h-14 px-3 bg-card-bg-color rounded-lg'>
      <div className='flex items-center'>
        <span className='text-sm font-medium text-block-title-color'>
          已选 {selectedCount} 项目
        </span>
      </div>
      <div className='flex gap-2 items-center'>
        <Button onClick={onBatchDownload}>批量下载</Button>
        <Button onClick={onBatchDelete}>批量删除</Button>
      </div>
    </div>
  )
}

export default memo(WorkGallerySelectionBar)
