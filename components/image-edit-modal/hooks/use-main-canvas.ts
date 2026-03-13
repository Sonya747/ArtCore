import * as fabric from 'fabric'
import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadFile } from '@/utils/download'
import { urlToDataURL } from '@/utils/image-encode'

/**
 * Canvas 尺寸信息
 */
export interface CanvasSizeInfo {
  /** Canvas 显示宽度（适配容器后的尺寸） */
  canvasWidth: number
  /** Canvas 显示高度（适配容器后的尺寸） */
  canvasHeight: number
  /** 原始图片宽度 */
  originalImageWidth: number
  /** 原始图片高度 */
  originalImageHeight: number
}

/**
 * 根据图片和容器尺寸计算适配的 canvas 尺寸
 */
const calculateCanvasSize = (
  imgWidth: number,
  imgHeight: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } => {
  const imgRatio = imgWidth / imgHeight
  const containerRatio = containerWidth / containerHeight

  let canvasWidth: number
  let canvasHeight: number

  if (imgRatio > containerRatio) {
    // 图片更宽，以宽度为准
    canvasWidth = Math.min(imgWidth, containerWidth)
    canvasHeight = canvasWidth / imgRatio
  } else {
    // 图片更高，以高度为准
    canvasHeight = Math.min(imgHeight, containerHeight)
    canvasWidth = canvasHeight * imgRatio
  }

  return {
    width: Math.floor(canvasWidth),
    height: Math.floor(canvasHeight),
  }
}

/**
 * 加载图片并获取其尺寸
 */
const loadImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = (error) => {
        console.error(
          `Failed to load image dimensions: ${error instanceof Error ? error.message : String(error)}`
        )
        resolve({ width: 200, height: 200 })
      }
      img.src = dataUrl
    } catch (error) {
      console.error(
        `Failed to load image dimensions: ${error instanceof Error ? error.message : String(error)}`
      )
      resolve({ width: 200, height: 200 })
    }
  })
}

interface UseImageEditReturn {
  fabricCanvas: fabric.Canvas | null
  canvasSize: CanvasSizeInfo
  isInitialized: boolean
  exportImage: () => string
  downloadImage: () => void
  isLoading: boolean
}
/**
 * 图片编辑器hooks
 * @param canvasRef - canvas 元素引用
 * @param containerRef - 容器元素引用
 * @param imageUrl - 图片url
 * @returns {
 *  fabricCanvas: 画布canvas实例
 *  canvasSize: 图片原始尺寸和画布尺寸信息
 *  isInitialized: 画布是否已初始化
 * }
 */
export const useImageEdit = ({
  canvasRef,
  containerRef,
  imageUrl,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  containerRef: React.RefObject<HTMLElement | null>
  imageUrl: string
}): UseImageEditReturn => {
  const fabricCanvas = useRef<fabric.Canvas>(null)
  const [canvasSize, setCanvasSize] = useState<CanvasSizeInfo>({
    canvasWidth: 0,
    canvasHeight: 0,
    originalImageWidth: 0,
    originalImageHeight: 0,
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * 加载图片到 canvas
   */
  const loadImageToCanvas = useCallback(
    async (
      fabricCanvas: fabric.Canvas,
      dataUrl: string,
      imgWidth: number,
      imgHeight: number,
      canvasWidth: number,
      canvasHeight: number
    ): Promise<void> => {
      try {
        return new Promise((resolve, reject) => {
          fabric.FabricImage.fromURL(dataUrl)
            .then((img: fabric.FabricImage) => {
              img.set({
                scaleX: canvasWidth / imgWidth,
                scaleY: canvasHeight / imgHeight,
                name: 'background',
                selectable: false,
                evented: false,
              })
              fabricCanvas.add(img)
              fabricCanvas.renderAll()
              resolve()
            })
            .catch((error) => {
              console.error('Failed to load image:', error)
              reject(error)
            })
        })
      } catch (error) {
        throw new Error(
          `Failed to load image to canvas: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    },
    []
  )

  /**
   * 初始化 canvas
   */
  const initCanvas = useCallback(
    async (el: HTMLCanvasElement, container: HTMLElement, imageUrl: string) => {
      // 清理旧的 canvas
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose()
      }

      if (!el || !container || !imageUrl) {
        return null
      }

      try {
        const imageDataUrl = await urlToDataURL(imageUrl)
        // 1. 加载图片获取尺寸
        const { width: imgWidth, height: imgHeight } = await loadImageDimensions(imageDataUrl)

        // 2. 获取容器尺寸
        const { width: containerWidth, height: containerHeight } =
          window.getComputedStyle(container)

        // 3. 计算适配后的 canvas 尺寸
        const { width, height } = calculateCanvasSize(
          imgWidth,
          imgHeight,
          Number.parseFloat(containerWidth),
          Number.parseFloat(containerHeight)
        )

        // 4. 创建 fabric canvas
        if (fabricCanvas.current) {
          fabricCanvas.current.dispose()
        }
        fabricCanvas.current = new fabric.Canvas(el, {
          width,
          height,
        })

        // 5. 加载图片到 canvas
        loadImageToCanvas(fabricCanvas.current, imageDataUrl, imgWidth, imgHeight, width, height)

        // 保存尺寸信息
        setCanvasSize({
          canvasWidth: width,
          canvasHeight: height,
          originalImageWidth: imgWidth,
          originalImageHeight: imgHeight,
        })
        setIsInitialized(true)

        return fabricCanvas.current
      } catch (error) {
        console.error('Failed to initialize canvas:', error)
        return null
      }
    },
    [containerRef, loadImageToCanvas]
  )

  /**编辑后的图片导出为png
   * @returns {
   *  image: 编辑后的图片DataURL
   * }
   */
  const exportImage = (): string => {
    if (!fabricCanvas.current) return ''
    const imageDataURL = fabricCanvas.current.toDataURL({
      multiplier: canvasSize.originalImageWidth / canvasSize.canvasWidth,
      format: 'png',
      quality: 1.0,
    })
    return imageDataURL
  }

  /**
   * 下载图片
   */
  const downloadImage = async (): Promise<void> => {
    const imageBlob = await fabricCanvas.current?.toBlob({
      multiplier: canvasSize.originalImageWidth / canvasSize.canvasWidth,
      format: 'png',
      quality: 1.0,
    })
    if (!imageBlob) return Promise.reject(new Error('导出的图片为空'))
    downloadFile({
      blob: imageBlob,
      fileName: `edited_image_${Date.now()}.png`,
    })
  }
  // 初始化canvas
  useEffect(() => {
    setIsLoading(true)
    if (!canvasRef?.current || !containerRef?.current || !imageUrl) return
    initCanvas(canvasRef.current, containerRef.current, imageUrl)
      .then((canvas) => {
        if (canvas) {
          fabricCanvas.current = canvas
        }
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => {
      if (fabricCanvas.current) {
        //清理fabric canvas
        fabricCanvas.current.dispose()
        fabricCanvas.current = null
        // canvasState.setCanvas(fabricCanvas);
      }
      // 重置状态
      setCanvasSize({
        canvasWidth: 0,
        canvasHeight: 0,
        originalImageWidth: 0,
        originalImageHeight: 0,
      })
      setIsInitialized(false)
    }
    // 这些变量在依赖里会出现切换工具触发重新加载canvas的情况
    //   }, [canvasRef.current, imageUrl, fabricCanvas]);
  }, [imageUrl, initCanvas])

  return {
    fabricCanvas: fabricCanvas.current,
    canvasSize,
    isInitialized,
    exportImage,
    downloadImage,
    isLoading,
  }
}
