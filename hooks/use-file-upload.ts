import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseFileUploadOptions {
  /** 文件回调，返回上传的文件列表 */
  onUpload?: (files: File[]) => void
  /** 是否只接受图片类型，默认 true */
  imageOnly?: boolean
  /** 是否启用悬停粘贴，默认 true */
  hover?: boolean
  /** 是否启用拖拽上传，默认 true */
  drag?: boolean
  /** 是否禁用，默认 false */
  disabled?: boolean
}

export interface UseFileUploadResult<T extends HTMLElement> {
  /** 绑定到目标元素的 ref */
  ref: React.RefObject<T | null>
  /** 当前是否悬停在元素上 */
  isHovering: boolean
  /** 当前是否正在拖拽文件 */
  isDragging: boolean
  /** 拖拽事件处理器（需要绑定到元素上） */
  dragProps: {
    onDragEnter: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
}

/**
 * 文件上传 hook，支持悬停粘贴和拖拽上传
 *
 * @example
 * ```tsx
 * const { ref, isDragging, dragProps } = useFileUpload<HTMLDivElement>({
 *   onUpload: (files) => {
 *   },
 *   imageOnly: true,
 * })
 *
 * return (
 *   <div ref={ref} {...dragProps} className={isDragging ? 'dragging' : ''}>
 *     悬停可粘贴，拖拽可上传
 *   </div>
 * )
 * ```
 */
function useFileUpload<T extends HTMLElement = HTMLDivElement>(
  options: UseFileUploadOptions = {}
): UseFileUploadResult<T> {
  const { onUpload, imageOnly = true, hover = true, drag = true, disabled = false } = options
  const ref = useRef<T>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const onUploadRef = useRef(onUpload)
  const dragCounterRef = useRef(0)

  // 保持 onUpload 回调的最新引用
  useEffect(() => {
    onUploadRef.current = onUpload
  }, [onUpload])

  // 过滤文件
  const filterFiles = useCallback(
    (files: File[]): File[] => {
      if (imageOnly) {
        return files.filter((file) => file.type.startsWith('image/'))
      }
      return files
    },
    [imageOnly]
  )

  // 监听 hover 状态（用于粘贴）
  useEffect(() => {
    const element = ref.current
    if (!element || disabled || !hover) return

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [disabled, hover])

  // 全局粘贴事件监听
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (const item of Array.from(items)) {
        const file = item.getAsFile()
        if (file) files.push(file)
      }

      const filteredFiles = filterFiles(files)
      if (filteredFiles.length > 0) {
        e.preventDefault()
        onUploadRef.current?.(filteredFiles)
      }
    },
    [filterFiles]
  )

  useEffect(() => {
    if (!isHovering || disabled || !hover) return

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [isHovering, disabled, hover, handlePaste])

  // 拖拽事件处理
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (disabled || !drag) return
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current += 1
      if (e.dataTransfer.types.includes('Files')) {
        setIsDragging(true)
      }
    },
    [disabled, drag]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled || !drag) return
      e.preventDefault()
      e.stopPropagation()
    },
    [disabled, drag]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (disabled || !drag) return
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current -= 1
      if (dragCounterRef.current === 0) {
        setIsDragging(false)
      }
    },
    [disabled, drag]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (disabled || !drag) return
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounterRef.current = 0

      const files = Array.from(e.dataTransfer.files)
      const filteredFiles = filterFiles(files)
      if (filteredFiles.length > 0) {
        onUploadRef.current?.(filteredFiles)
      }
    },
    [disabled, drag, filterFiles]
  )

  const dragProps = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  }

  return { ref, isHovering, isDragging, dragProps }
}

export default useFileUpload
