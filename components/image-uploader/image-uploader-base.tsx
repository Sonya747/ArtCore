import { DownOutlined } from '@ant-design/icons'
import { Button, message, Select } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFileUpload } from '@/hooks'
import { cn } from '../../utils/cn'
import { checkImagePixels } from '../../utils/image-encode'
import IconFont from '../icon-font'
import { ImageEditModal } from '../image-edit-modal'
import { useImageEditModal } from '../image-edit-modal/hooks/use-image-edit-modal'
import './index.css'
import type { IMAGES } from '@/service/images/typing'
import MagicHint from './magic-hint'
import type { ImageUploaderProps } from './types'
import UploadButton from './upload-button'

/**
 * 图片上传组件
 */
const ImageUploaderBase = ({
  title = '',
  subTitle = '',
  maxCount = 5,
  value = [],
  onChange,
  hint,
  actions = ['delete', 'edit'],
  imageTypes,
  fileSizeLimit,
  pixelLimit,
}: ImageUploaderProps) => {
  const { modalProps, openModal, closeModal } = useImageEditModal()
  const hasImageTypesRef = useRef(false)
  const [shouldFlash, setShouldFlash] = useState(false)

  // 兼容：上层可能直接传入图片 URL 数组（string[]），而不是 IMAGES.ImageData[]
  const imagesValue: IMAGES.ImageData[] = useMemo(() => {
    const raw = Array.isArray(value) ? (value as unknown[]) : []
    return raw
      .map((item) => {
        if (typeof item === 'string') {
          return { data: item, type: 'image' as const } as IMAGES.ImageData
        }
        if (item && typeof item === 'object' && 'data' in item) {
          return item as IMAGES.ImageData
        }
        return null
      })
      .filter((x): x is IMAGES.ImageData => Boolean(x))
  }, [value])

  // 初始化归一化：将 value 里的 string URL 自动转换成 IMAGES.ImageData，避免上层流程把它当“非对象”而丢失
  useEffect(() => {
    if (!onChange) return
    const raw = Array.isArray(value) ? (value as unknown[]) : []
    const hasString = raw.some((item) => typeof item === 'string')
    if (!hasString) return
    onChange(imagesValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // 处理上传的文件（粘贴和拖拽共用）
  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      let imageFiles = files.filter(
        (file) => file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
      )
      if (imageFiles.length === 0) return

      // 过滤超出大小限制的文件
      if (fileSizeLimit) {
        const validFiles = imageFiles.filter((file) => file.size <= fileSizeLimit)
        const oversizedCount = imageFiles.length - validFiles.length
        if (oversizedCount > 0) {
          const limitMB = fileSizeLimit / (1000 * 1000)
          message.warning(`${oversizedCount}张图片超过${limitMB}MB大小限制，已过滤`)
        }
        imageFiles = validFiles
        if (imageFiles.length === 0) return
      }

      // 过滤超出像素限制的文件
      if (pixelLimit) {
        const pixelCheckResults = await Promise.all(
          imageFiles.map((file) => checkImagePixels(file, pixelLimit))
        )
        console.log(pixelCheckResults)
        const validFiles = imageFiles.filter((_, index) => pixelCheckResults[index])
        const invalidCount = imageFiles.length - validFiles.length
        if (invalidCount > 0) {
          message.warning(`${invalidCount}张图片尺寸不满足要求（长和宽需≥${pixelLimit}px），已过滤`)
        }
        imageFiles = validFiles
        if (imageFiles.length === 0) return
      }

      const defaultImageType = imageTypes && imageTypes.length > 0 ? imageTypes[0].value : ''
      const newImages: IMAGES.ImageData[] = imageFiles.map((file) => ({
        data: URL.createObjectURL(file),
        type: 'image' as const,
        image_type: defaultImageType,
      }))

      const remainingSlots = maxCount - imagesValue.length
      if (remainingSlots <= 0) {
        message.warning(`最多上传${maxCount}张图片`)
        return
      }

      if (remainingSlots < newImages.length) {
        message.warning(`最多上传${maxCount}张图片，当前保留前${remainingSlots}张`)
      }

      const updatedImages = [...imagesValue, ...newImages].slice(0, maxCount)
      onChange?.(updatedImages)
    },
    [imageTypes, maxCount, imagesValue, onChange, fileSizeLimit, pixelLimit]
  )

  // 使用文件上传 hook
  const {
    ref: containerRef,
    isDragging,
    dragProps,
  } = useFileUpload<HTMLDivElement>({
    onUpload: handleUploadFiles,
  })

  // 检测 imageTypes 从无到有的变化
  useEffect(() => {
    const hasImageTypes = Boolean(imageTypes && imageTypes.length > 0)
    if (hasImageTypes && !hasImageTypesRef.current) {
      // 第一次从没有到有，触发闪烁
      setShouldFlash(true)
      hasImageTypesRef.current = true
    } else if (!hasImageTypes) {
      // 如果 imageTypes 变为空，重置状态以便下次可以再次触发
      hasImageTypesRef.current = false
      setShouldFlash(false)
    }
  }, [imageTypes])

  // 处理文件上传（input 选择）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    handleUploadFiles(Array.from(files))
  }

  // 处理删除
  const handleDelete = (index: number) => {
    const newImages = imagesValue.filter((_, i) => i !== index)
    onChange?.(newImages)
  }

  // 处理编辑
  const handleEdit = (index: number) => {
    openModal({
      imageUrl: imagesValue[index].data,
      mode: 'edit',
      onSave: (canvasResult) => {
        console.log(canvasResult)
        if (!canvasResult.imageDataURL) return
        const updatedImages = [...imagesValue]
        updatedImages[index] = {
          ...imagesValue[index],
          data: canvasResult.imageDataURL,
        }
        onChange?.(updatedImages)
        closeModal()
      },
      onCancel: closeModal,
    })
  }

  // 处理图片类型变化
  const handleImageTypeChange = (index: number, imageType: string) => {
    const updatedImages = [...imagesValue]
    updatedImages[index] = {
      ...imagesValue[index],
      image_type: imageType,
    }
    onChange?.(updatedImages)
  }

  useEffect(() => {
    if (imagesValue.length > maxCount) {
      const newImages = imagesValue.slice(0, maxCount)
      onChange?.(newImages)
    }
  }, [maxCount, imagesValue, onChange])

  return (
    <div className='flex flex-col gap-2'>
      {/* 标题行 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-0'>
          <span className='text-sm font-medium text-block-title-color'>{title}</span>
          {subTitle}
        </div>
        {maxCount > 1 && (
          <span className='text-sm text-[#AAB3B8] dark:text-gray-500'>
            {imagesValue.length}/{maxCount}
          </span>
        )}
      </div>

      {/* 上传区域 */}
      <div
        ref={containerRef}
        className={cn(
          'group/uploader',
          'flex flex-col gap-2 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl inset-shadow-card box-border',
          'border transition-colors',
          'hover:border-primary-color',
          isDragging ? 'border-primary-color' : 'border-transparent'
        )}
        {...dragProps}
      >
        {/* 图片列表 */}
        <div className='flex flex-wrap gap-2'>
          {imagesValue.map((image, index) => (
            <div
              key={`${image.type}-${image.data}-${index}`}
              className='relative w-[117px] h-[117px] rounded-md overflow-hidden group'
            >
              <img
                src={image.data}
                alt={`上传图片 ${index + 1}`}
                className='w-full h-full object-cover'
              />
              {imageTypes && (
                <div
                  className={cn(
                    'absolute top-0 left-0 right-0 flex justify-center',
                    'text-white bg-neutral-700/70 rounded-t-md',
                    shouldFlash && 'image-uploader-flash'
                  )}
                  onAnimationEnd={() => {
                    setShouldFlash(false)
                  }}
                >
                  <Select
                    options={imageTypes}
                    value={image.image_type}
                    size='small'
                    variant='borderless'
                    suffixIcon={<DownOutlined className='text-white!' />}
                    className={cn('[&_.ant-select-content-value]:text-white!')}
                    onChange={(value) => handleImageTypeChange(index, value)}
                  />
                </div>
              )}

              <div
                className={cn(
                  'absolute bottom-0 left-0 right-0',
                  'flex items-center justify-center gap-4',
                  'bg-neutral-700/70 rounded-b-md'
                )}
              >
                <Button
                  title='编辑'
                  type='text'
                  size='small'
                  hidden={!actions.includes('edit')}
                  onClick={() => handleEdit(index)}
                  className=' text-white hover:text-gray-200'
                  icon={<IconFont type='icon-edit' className='text-white!' />}
                />

                <Button
                  title='删除'
                  type='text'
                  size='small'
                  hidden={!actions.includes('delete')}
                  onClick={() => handleDelete(index)}
                  className=' text-white hover:text-gray-200'
                  icon={<IconFont type='icon-delete' className='text-white!' />}
                />
              </div>
            </div>
          ))}

          {/* 添加按钮 */}
          {imagesValue.length < maxCount && (
            <UploadButton
              className='w-[117px] h-[117px]'
              multiple={maxCount > 1}
              onChange={handleFileSelect}
            />
          )}
        </div>

        {/* 提示文本 */}
        <MagicHint hint={hint} />
      </div>
      <ImageEditModal {...modalProps} />
    </div>
  )
}

export default ImageUploaderBase
