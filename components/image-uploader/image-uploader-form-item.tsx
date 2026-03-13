import { App, Button } from 'antd'
import { useEffect, useMemo } from 'react'
import { cn } from '../../utils/cn'
import IconFont from '../icon-font'
import UploadButton from './upload-button'

export interface EffectImageUploaderProps {
  /** 图片文件 */
  value?: File | string
  /** 图片变化回调 */
  onChange?: (file: File | undefined) => void
  /** 自定义类名 */
  className?: string
  /** 图片预览区域类名 */
  imageClassName?: string
  /** 提示文本 */
  hint?: string
  /** 接受的文件类型 */
  accept?: string
  /** 最大文件大小（单位：MB） */
  fileSizeLimit?: number
}

/**
 * 效果图上传组件
 * 支持表单控制，用于上传单张效果图
 */
const ImageUploaderFormItem = ({
  value,
  onChange,
  className,
  imageClassName = 'w-30 h-40',
  hint = '支持 jpg、png、gif 格式 大小不超过 5MB',
  accept = 'image/jpeg,image/png,image/gif',
  fileSizeLimit,
}: EffectImageUploaderProps) => {
  const { message } = App.useApp()
  // 生成预览 URL
  const imageUrl = useMemo(() => {
    if (typeof value === 'string') {
      return value
    }
    if (value instanceof File) {
      return URL.createObjectURL(value)
    }
    return null
  }, [value])

  // 清理预览 URL，避免内存泄漏
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (fileSizeLimit) {
        // 检查文件大小，使用磁盘计算规则（1MB = 1000 * 1000）
        if (file.size > fileSizeLimit * 1000 * 1000) {
          message.error(`文件大小不能超过 ${fileSizeLimit}MB`)
          e.target.value = ''
          return
        }
      }
      onChange?.(file)
    }
  }

  // 处理删除
  const handleDelete = () => {
    onChange?.(undefined)
  }

  return (
    <div className={cn('flex flex-row items-center gap-2', className)}>
      {imageUrl ? (
        <div className={cn('relative overflow-hidden group rounded-md', imageClassName)}>
          <img src={imageUrl} alt='效果图' className='w-full h-full object-cover rounded-md' />
          <div className='absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-neutral-700/70 opacity-0 group-hover:opacity-100 transition-opacity'>
            <Button
              title='删除'
              type='text'
              size='small'
              onClick={handleDelete}
              className='text-white hover:text-gray-200'
              icon={<IconFont type='icon-delete' className='text-white!' />}
            />
          </div>
        </div>
      ) : (
        <UploadButton
          className={imageClassName}
          accept={accept}
          hoverHighlight
          onChange={handleFileSelect}
        />
      )}
      <div className='w-[155px] text-[#AAB3B8] dark:text-gray-500'>{hint}</div>
    </div>
  )
}

export default ImageUploaderFormItem
