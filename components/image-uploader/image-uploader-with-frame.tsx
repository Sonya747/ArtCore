import { RightOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import { useCallback, useState } from 'react'
import { useFileUpload } from '@/hooks'
import { cn } from '../../utils/cn'
import IconFont from '../icon-font'
import { ImageEditModal } from '../image-edit-modal'
import { useImageEditModal } from '../image-edit-modal/hooks/use-image-edit-modal'
import MagicHint from './magic-hint'
import UploadButton from './upload-button'
import { IMAGES } from '@/app/service/images/typing'
import { checkImagePixels } from '@/utils/image-encode'

export interface ImageUploaderWithFrameProps {
  /** 标题 */
  title?: string
  /** 副标题 */
  subTitle?: React.ReactNode
  /** 当前值: value[0] 为首帧图，value[1] 为尾帧图 */
  value?: IMAGES.ImageData[]
  /** 值变化回调 */
  onChange?: (value: IMAGES.ImageData[]) => void
  /** 提示文本 */
  hint?: string
  /** 文件大小限制（字节），默认不限制，使用磁盘计算规则（1MB = 1000 * 1000） */
  fileSizeLimit?: number
  /** 像素限制，长和宽必须大于等于该值 */
  pixelLimit?: number
}

/**
 * 首尾帧图片上传组件
 */
const ImageUploaderWithFrame = ({
  title,
  subTitle,
  value = [],
  onChange,
  hint,
  fileSizeLimit,
  pixelLimit,
}: ImageUploaderWithFrameProps) => {
  const { modalProps, openModal, closeModal } = useImageEditModal()
  const [isStartHover, setIsStartHover] = useState(false)
  const [isEndHover, setIsEndHover] = useState(false)

  // 获取首帧和尾帧数据
  const startFrame = value[0]
  const endFrame = value[1]

  // 处理文件
  const processFile = useCallback(
    async (file: File, frameType: 'start' | 'end') => {
      // 验证文件类型
      if (!file.type.startsWith('image/') || !['image/jpeg', 'image/png'].includes(file.type)) {
        message.error('仅支持 jpg、png 格式')
        return
      }

      // 验证文件大小
      if (fileSizeLimit && file.size > fileSizeLimit) {
        const limitMB = fileSizeLimit / (1000 * 1000)
        message.error(`图片大小不能超过 ${limitMB}MB`)
        return
      }

      // 验证像素限制
      if (pixelLimit) {
        const isValid = await checkImagePixels(file, pixelLimit)
        if (!isValid) {
          message.error(`图片尺寸不满足要求（长和宽需≥${pixelLimit}px）`)
          return
        }
      }

      if (frameType === 'start') {
        onChange?.([
          {
            data: URL.createObjectURL(file),
            type: 'first_frame',
          },
          value[1],
        ])
      } else {
        onChange?.([
          value[0],
          {
            data: URL.createObjectURL(file),
            type: 'last_frame',
          },
        ])
      }
    },
    [value, onChange, fileSizeLimit, pixelLimit]
  )

  // 使用文件上传 hook - 首帧
  const {
    ref: startFrameRef,
    isDragging: isStartDragging,
    dragProps: startDragProps,
  } = useFileUpload<HTMLDivElement>({
    onUpload: useCallback(
      (files: File[]) => {
        if (files.length > 0) {
          processFile(files[0], 'start')
        }
      },
      [processFile]
    ),
  })

  // 使用文件上传 hook - 尾帧
  const {
    ref: endFrameRef,
    isDragging: isEndDragging,
    dragProps: endDragProps,
  } = useFileUpload<HTMLDivElement>({
    onUpload: useCallback(
      (files: File[]) => {
        if (files.length > 0) {
          processFile(files[0], 'end')
        }
      },
      [processFile]
    ),
  })

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, frameType: 'start' | 'end') => {
    const files = e.target.files
    if (!files || files.length === 0) return
    processFile(files[0], frameType)
    // 重置 input 以允许重复选择同一文件
    e.target.value = ''
  }

  // 处理删除
  const handleDelete = (frameType: 'start' | 'end') => {
    const newValue = [...value]
    if (frameType === 'start') {
      newValue[0] = {
        data: '',
        type: 'first_frame',
      }
    } else {
      newValue[1] = {
        data: '',
        type: 'last_frame',
      }
    }
    onChange?.(newValue)
  }

  // 处理编辑
  const handleEdit = (frameType: 'start' | 'end') => {
    const imageData = frameType === 'start' ? startFrame : endFrame
    if (!imageData?.data) return

    openModal({
      imageUrl: imageData.data,
      mode: 'edit',
      onSave: (canvasResult) => {
        if (!canvasResult.imageDataURL) return
        const newValue = [...value]
        const index = frameType === 'start' ? 0 : 1
        newValue[index] = {
          ...newValue[index],
          data: canvasResult.imageDataURL,
        }
        onChange?.(newValue)
        closeModal()
      },
      onCancel: closeModal,
    })
  }

  // 渲染帧上传区域
  const renderFrameUploader = (frameType: 'start' | 'end') => {
    const isStart = frameType === 'start'
    const imageData = isStart ? startFrame : endFrame
    const imageUrl = imageData?.data
    const isCurrentDragging = isStart ? isStartDragging : isEndDragging
    const frameRef = isStart ? startFrameRef : endFrameRef
    const frameDragProps = isStart ? startDragProps : endDragProps

    return (
      <div
        ref={frameRef}
        className='flex flex-col items-center gap-1'
        {...frameDragProps}
        onMouseEnter={() => (isStart ? setIsStartHover(true) : setIsEndHover(true))}
        onMouseLeave={() => (isStart ? setIsStartHover(false) : setIsEndHover(false))}
      >
        {/* 标题 */}
        <div className='flex items-center'>
          <span className='text-sm font-medium text-block-title-color'>
            {isStart ? '首帧' : '尾帧'}
          </span>
          {!isStart && (
            <span className='text-sm font-medium text-[#AAB3B8] dark:text-gray-500'>（可选）</span>
          )}
        </div>

        {/* 上传区域 */}
        <div
          className={cn(
            'relative w-40 h-40 rounded-md overflow-hidden',
            'border border-dashed transition-colors',
            'hover:border-primary-color',
            isCurrentDragging ? 'border-primary-color' : 'border-[#CDD2D6] dark:border-gray-600'
          )}
        >
          {imageUrl ? (
            // 已上传图片
            <div className='relative w-full h-full group'>
              <img
                src={imageUrl}
                alt={isStart ? '首帧' : '尾帧'}
                className='w-full h-full object-cover'
              />
              {/* 操作按钮 */}
              <div className='absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-neutral-700/70 opacity-0 group-hover:opacity-100 transition-opacity'>
                <Button
                  title='编辑'
                  type='text'
                  size='small'
                  onClick={() => handleEdit(frameType)}
                  className='text-white hover:text-gray-200'
                  icon={<IconFont type='icon-edit' className='text-white!' />}
                />
                <Button
                  title='删除'
                  type='text'
                  size='small'
                  onClick={() => handleDelete(frameType)}
                  className='text-white hover:text-gray-200'
                  icon={<IconFont type='icon-delete' className='text-white!' />}
                />
              </div>
            </div>
          ) : (
            // 上传占位
            <UploadButton
              className='w-full h-full border-0'
              onChange={(e) => handleFileSelect(e, frameType)}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* 标题行 */}
      {(title || subTitle) && (
        <div className='flex items-center gap-0'>
          {title && <span className='text-sm font-medium text-block-title-color'>{title}</span>}
          {subTitle}
        </div>
      )}

      {/* 上传区域容器 */}
      <div className='flex flex-col gap-2 p-4 pt-2 bg-white dark:bg-[#1a1a1a] rounded-xl inset-shadow-card border border-transparent'>
        {/* 首尾帧上传 */}
        <div className='flex items-center justify-between gap-2'>
          {renderFrameUploader('start')}

          {/* 箭头 */}
          <div className='flex items-center pt-6'>
            <RightOutlined className='text-sm text-[#606E76] dark:text-gray-400' />
          </div>

          {renderFrameUploader('end')}
        </div>

        {/* 提示文本 */}
        <MagicHint hint={hint} magicText='Ctrl+V可粘贴图片' isHover={isStartHover || isEndHover} />
      </div>

      <ImageEditModal {...modalProps} />
    </div>
  )
}

export default ImageUploaderWithFrame
