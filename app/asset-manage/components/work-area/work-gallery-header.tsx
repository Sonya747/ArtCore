import { Button, Switch } from 'antd'
import { memo } from 'react'
import GradientButton from '@/components/gradient-button'
import Search from '@/components/search'

export interface WorkGalleryHeaderProps {
  albumId?: string
  groupByTask: boolean
  selecting: boolean
  onGroupByTaskChange: (checked: boolean) => void
  onBatchOperationClick: () => void
  onCancelSelect: () => void
  onSearch: (value: string) => void
  selectedCount: number
  onBatchDownload: () => void
  onBatchDelete: () => void
  onBatchModify: () => void
  canDownload: boolean
  canModify: boolean
  onBatchRemoveFromAlbum: () => void
}

/**
 * 作品画廊操作区域组件
 */
const WorkGalleryHeader = ({
  albumId,
  groupByTask,
  selecting,
  onGroupByTaskChange,
  onBatchOperationClick,
  onCancelSelect,
  onSearch,
  canDownload,
  canModify,
  selectedCount,
  onBatchDownload,
  onBatchDelete,
  onBatchModify,
  onBatchRemoveFromAlbum,
}: WorkGalleryHeaderProps) => {
  return (
    <div>
      <div className='flex items-center justify-between w-full'>
        <div className='flex items-center'>
          <h2 className='text-sm font-medium text-block-title-color mr-4'>作品</h2>
          <Search placeholder='输入名称搜索作品' onSearch={onSearch} className='w-66!' />
        </div>
        <div className='flex gap-6 items-center'>
          <div className='flex items-center'>
            <h2 className='text-sm font-medium text-block-title-color mr-4'>按任务堆叠</h2>
            <Switch checked={groupByTask} onChange={onGroupByTaskChange} />
          </div>
          {!selecting && (
            <GradientButton type='primary' gradient='secondary' onClick={onBatchOperationClick}>
              批量操作
            </GradientButton>
          )}
          {selecting && (
            <GradientButton type='primary' gradient='secondary' onClick={onCancelSelect}>
              取消批量
            </GradientButton>
          )}
        </div>
      </div>
      {selecting && (
        <div className='mt-4 flex items-center justify-between w-full h-14 px-3 bg-[#F9FAFC] dark:bg-[#171718] rounded-md'>
          <div className='flex items-center'>
            <span className='text-sm font-normal text-block-title-color'>
              已选 {selectedCount} 个项目
            </span>
          </div>
          <div className='flex gap-2 items-center'>
            <Button
              onClick={onBatchDownload}
              variant='filled'
              color='default'
              disabled={!canDownload || !selectedCount}
              classNames={{
                content: 'block-title-color',
              }}
            >
              批量下载
            </Button>
            {!albumId && (
              <Button
                onClick={onBatchModify}
                variant='filled'
                color='default'
                disabled={!canModify || !selectedCount}
                classNames={{
                  content: 'block-title-color',
                }}
              >
                批量添加到专辑
              </Button>
            )}
            {!albumId && (
              <Button
                onClick={onBatchDelete}
                disabled={!selectedCount}
                variant='filled'
                color='default'
                classNames={{
                  content: 'text-red-500',
                }}
              >
                批量删除
              </Button>
            )}
            {albumId && (
              <Button
                onClick={onBatchRemoveFromAlbum}
                variant='filled'
                color='default'
                disabled={!canModify || !selectedCount}
                classNames={{
                  content: 'text-red-500',
                }}
              >
                批量移除
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(WorkGalleryHeader)
