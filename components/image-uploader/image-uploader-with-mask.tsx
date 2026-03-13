import { PlusOutlined } from '@ant-design/icons'
import { message, Popconfirm } from 'antd'
import { useCallback } from 'react'
import { useFileUpload } from '@/hooks'
import { cn } from '../../utils/cn'
import { checkImagePixels } from '../../utils/image-encode'
import IconFont from '../icon-font'
import { ImageEditModal } from '../image-edit-modal'
import { useImageEditModal } from '../image-edit-modal/hooks/use-image-edit-modal'
import './index.css'
import MagicHint from './magic-hint'
import type { ImageUploaderProps } from './types'
import UploadButton from './upload-button'

/**
 * 图片上传组件 (蒙版编辑版本)
 */
const ImageUploaderWithMask = ({
  title = '',
  subTitle = '',
  value = [], //value[0] 为图片，value[1] 为蒙版
  onChange,
  hint,
  fileSizeLimit,
  pixelLimit,
}: ImageUploaderProps) => {
  const { modalProps, openModal, closeModal } = useImageEditModal()

  // 处理上传的文件（粘贴和拖拽共用）
  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      // 过滤 jpg、png 格式
      let imageFiles = files.filter(
        (file) => file.type === 'image/jpeg' || file.type === 'image/png'
      )
      if (imageFiles.length === 0) return

      if (value.length >= 1) {
        message.warning('最多上传1张图片')
        return
      }

      // 过滤超出大小限制的文件
      if (fileSizeLimit) {
        const validFiles = imageFiles.filter((file) => file.size <= fileSizeLimit)
        if (validFiles.length === 0) {
          const limitMB = fileSizeLimit / (1000 * 1000)
          message.warning(`图片超过${limitMB}MB大小限制`)
          return
        }
        imageFiles = validFiles
      }

      // 过滤超出像素限制的文件
      if (pixelLimit) {
        const pixelCheckResults = await Promise.all(
          imageFiles.map((file) => checkImagePixels(file, pixelLimit))
        )
        const validFiles = imageFiles.filter((_, index) => pixelCheckResults[index])
        if (validFiles.length === 0) {
          message.warning(`图片尺寸不满足要求（长和宽需≥${pixelLimit}px）`)
          return
        }
        imageFiles = validFiles
      }

      if (imageFiles.length > 1) {
        message.warning('最多上传1张参考图，当前保留前1张')
      }

      // 只处理第一个文件
      const file = imageFiles[0]
      onChange?.([
        {
          data: URL.createObjectURL(file),
          type: 'image',
        },
      ])
    },
    [value, onChange, fileSizeLimit, pixelLimit]
  )

  // 使用文件上传 hook
  const {
    ref: containerRef,
    isDragging,
    dragProps,
  } = useFileUpload<HTMLDivElement>({
    onUpload: handleUploadFiles,
  })

  // 处理文件上传（input 选择）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    handleUploadFiles(Array.from(files))
  }

  // 处理删除
  const handleDelete = () => {
    onChange?.([])
  }

  // 处理编辑蒙版
  const handleEditMask = () => {
    openModal({
      imageUrl: value[0].data,
      mode: 'mask',
      onSave: (canvasResult) => {
        if (!canvasResult.maskImageDataURL) return
        // 如果已有蒙版，替换；否则新增
        const updatedImages = [
          value[0], // 保留原图片
          {
            data: canvasResult.maskImageDataURL,
            type: 'image' as const,
          },
        ]
        onChange?.(updatedImages)
        closeModal()
      },
      onCancel: closeModal,
    })
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* 标题行 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-0'>
          <span className='text-sm font-medium text-block-title-color'>{title}</span>
          {subTitle}
        </div>
      </div>

      {/* 上传区域 */}
      <div
        ref={containerRef}
        className={cn(
          'group/uploader',
          'flex flex-col gap-2 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl inset-shadow-card relative box-border',
          'border transition-colors',
          'hover:border-primary-color',
          isDragging ? 'border-primary-color' : 'border-transparent'
        )}
        {...dragProps}
      >
        {/* 图片列表 */}
        <div className='flex flex-wrap gap-2'>
          {value.map((image, index) => {
            const isMask = index === 1 // 第二个是蒙版
            return (
              <div
                key={image.data}
                className='relative w-[117px] h-[117px] rounded-md overflow-hidden group'
                onClick={isMask ? handleEditMask : undefined}
                style={isMask ? { cursor: 'pointer' } : undefined}
              >
                <img
                  src={image.data}
                  alt={`上传图片 ${index + 1}`}
                  className='w-full h-full object-cover'
                />
                {/* 蒙版浮层 */}
                {isMask && (
                  <div className='absolute inset-0 bg-black/30 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                    <span className='text-xs text-white leading-5'>点击编辑蒙版</span>
                  </div>
                )}
              </div>
            )
          })}

          {value.length < 2 && (
            <UploadButton
              className='w-[117px] h-[117px]'
              onChange={value.length === 0 ? handleFileSelect : undefined}
              onClick={
                value.length === 1
                  ? (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleEditMask()
                    }
                  : undefined
              }
            >
              {value.length === 0 ? (
                <PlusOutlined className='text-base text-button-text-color' />
              ) : (
                <span className='text-xs text-neutral-400'>点击编辑蒙版</span>
              )}
            </UploadButton>
          )}
        </div>
        <Popconfirm
          title='确定删除图片吗？删除图片后,已编辑的蒙版也将清除'
          onConfirm={handleDelete}
          okText='确定'
          cancelText='取消'
          placement='topRight'
          classNames={{
            content: 'w-58',
          }}
        >
          <IconFont
            type='icon-delete'
            className='absolute top-4 right-4 text-button-text-color! cursor-pointer hover:text-red-400!'
          />
        </Popconfirm>
        {/* 提示文本 */}
        <MagicHint hint={hint} />
      </div>
      <ImageEditModal {...modalProps} />
    </div>
  )
}

export default ImageUploaderWithMask
