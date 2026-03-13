import * as fabric from 'fabric'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CanvasSizeInfo } from './use-main-canvas'

/**
 * 蒙版对象类型扩展
 */
interface MaskObject extends fabric.FabricObject {
  maskObject?: boolean
}

/**
 * 蒙版对象信息
 */
interface MaskObjectInfo {
  type: string
  data: ReturnType<fabric.FabricObject['toObject']>
}

interface UseMaskReturn {
  /** 蒙版画布 DOM 元素引用 */
  // maskCanvasEl: React.RefObject<HTMLCanvasElement | null>;
  /** 蒙版画布实例 */
  maskCanvas: React.MutableRefObject<fabric.Canvas | null>
  /** 是否显示蒙版 */
  showMask: boolean
  /** 蒙版对象列表 */
  maskObjects: fabric.FabricObject[]
  /** 初始化蒙版画布 */
  // initMaskCanvas: () => Promise<void>;
  /** 更新蒙版画布 */
  updateMaskCanvas: (canvas?: fabric.Canvas) => Promise<void>
  /** 生成蒙版数据（用于 ComfyUI inpainting） */
  generateMaskData: (canvas: fabric.Canvas) => number[][]
  /** 生成蒙版图像（黑底图像，白色为蒙版区域） */
  generateMaskImage: () => string
  /** 切换蒙版显示 */
  toggleMaskView: (canvas?: fabric.Canvas) => void
  /** 清空蒙版对象 */
  clearMaskObjects: () => void
  /** 获取蒙版对象信息 */
  getMaskObjectsInfo: (canvas: fabric.Canvas) => MaskObjectInfo[]
  /** 销毁蒙版画布 */
  disposeMaskCanvas: () => void
  /** 设置原图真实尺寸 */
  setOriginalImageSize: (width: number, height: number) => void
}

/**
 * 蒙版管理 Hook（React 版本）
 * @param fabricCanvas - fabric Canvas 实例（保留用于扩展，当前未直接使用）
 * @param canvasSize - Canvas 尺寸信息
 * @param isInitialized - Canvas 是否已初始化
 */
export function useMask(
  fabricCanvas: fabric.Canvas | null,
  canvasSize: CanvasSizeInfo
): UseMaskReturn {
  const maskCanvas = useRef<fabric.Canvas | null>(null)
  const [showMask, setShowMask] = useState(false)
  const [maskObjects, setMaskObjects] = useState<fabric.FabricObject[]>([])

  const originalImageSizeRef = useRef({
    width: canvasSize.canvasWidth,
    height: canvasSize.canvasHeight,
  })

  // 自动设置原图真实尺寸（当 Canvas 初始化完成后）

  // 手动设置原图真实尺寸（保留用于向后兼容）
  const setOriginalImageSize = useCallback((width: number, height: number) => {
    originalImageSizeRef.current = { width, height }
  }, [])

  useEffect(() => {
    if (maskCanvas.current && canvasSize.canvasWidth > 0) {
      const width = canvasSize.canvasWidth / 4
      const height = canvasSize.canvasHeight / 4
      maskCanvas.current.setDimensions({ width, height })
    }
  }, [canvasSize.canvasWidth, canvasSize.canvasHeight])

  // 更新蒙版画布
  const updateMaskCanvas = useCallback(async (canvas?: fabric.Canvas) => {
    if (!maskCanvas.current || !canvas) return

    // 清空蒙版画布并设置黑色背景
    maskCanvas.current.clear()
    maskCanvas.current.backgroundColor = '#000000'
    maskCanvas.current.renderAll()

    // 绘制白色蒙版区域（表示要修复的区域）
    const scale = 0.25 // 蒙版预览是原图的1/4大小

    // 获取所有蒙版对象
    const allMaskObjects = canvas.getObjects().filter((obj) => (obj as MaskObject).maskObject)

    // 并行处理所有对象的克隆（提升性能）
    const clonePromises = allMaskObjects.map(async (obj) => {
      if (obj.type === 'path') {
        try {
          // 克隆原始路径并缩放用于蒙版预览
          // fabric.Object.clone() 返回 Promise
          const clonedPath = await (obj as fabric.Path).clone().then((cloned) => {
            if (!cloned) {
              throw new Error('克隆路径失败')
            }
            return cloned as fabric.Path
          })

          // 设置蒙版预览样式：白色填充和描边
          clonedPath.set({
            left: (obj.left || 0) * scale,
            top: (obj.top || 0) * scale,
            scaleX: (obj.scaleX || 1) * scale,
            scaleY: (obj.scaleY || 1) * scale,
            fill: '#ffffff', // 白色填充
            stroke: '#ffffff', // 白色描边
            strokeWidth: (obj.strokeWidth || 0) * scale,
            selectable: false,
            evented: false,
          })

          return clonedPath
        } catch (_error) {
          // 降级处理，这里是历史逻辑
          const bounds = obj.getBoundingRect()
          return new fabric.Rect({
            left: bounds.left * scale,
            top: bounds.top * scale,
            width: bounds.width * scale,
            height: bounds.height * scale,
            fill: '#ffffff',
            stroke: 'transparent',
            selectable: false,
            evented: false,
          })
        }
      }
      return null
    })

    const clonedObjects = await Promise.all(clonePromises)
    clonedObjects.forEach((obj) => {
      if (obj && maskCanvas.current) {
        maskCanvas.current.add(obj)
      }
    })

    maskCanvas.current.renderAll()
  }, [])

  // 生成蒙版数据 从旧平台迁移的逻辑，暂时没有使用
  const generateMaskData = useCallback((canvas: fabric.Canvas): number[][] => {
    if (!canvas) return []

    // 使用画布的实际尺寸
    const width = canvas.getWidth()
    const height = canvas.getHeight()

    // 初始化为全黑
    const maskData: number[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(0))

    // 获取所有蒙版对象
    const allMaskObjects = canvas.getObjects().filter((obj) => (obj as MaskObject).maskObject)
    if (allMaskObjects.length === 0) return []

    allMaskObjects.forEach((obj) => {
      if (obj.type === 'path') {
        // 根据路径包围盒设置蒙版区域为白色（1 = 要修复的区域）
        const bounds = obj.getBoundingRect()
        const startX = Math.max(0, Math.floor(bounds.left))
        const startY = Math.max(0, Math.floor(bounds.top))
        const endX = Math.min(width - 1, Math.floor(bounds.left + bounds.width))
        const endY = Math.min(height - 1, Math.floor(bounds.top + bounds.height))

        for (let y = startY; y <= endY; y++) {
          for (let x = startX; x <= endX; x++) {
            try {
              if (obj.containsPoint(new fabric.Point(x, y))) {
                maskData[y][x] = 1
              }
            } catch (error) {
              console.warn(`containsPoint 错误 at (${x}, ${y}):`, error)
            }
          }
        }
      }
    })

    return maskData
  }, [])

  /**
   * 生成蒙版图像（黑底图像，白色为蒙版区域）
   * @param canvas - fabric Canvas 实例
   * @returns 蒙版图像数据URL
   */
  const generateMaskImage = (): string => {
    const sourceCanvas = fabricCanvas
    if (!sourceCanvas) return ''
    const maskObjects = sourceCanvas.getObjects().filter((obj) => (obj as MaskObject).maskObject)
    if (maskObjects.length === 0) return ''

    // 目标尺寸：按原图尺寸导出
    const targetWidth = Math.round(
      canvasSize.originalImageWidth > 0 ? canvasSize.originalImageWidth : sourceCanvas.getWidth()
    )
    const targetHeight = Math.round(
      canvasSize.originalImageHeight > 0 ? canvasSize.originalImageHeight : sourceCanvas.getHeight()
    )

    // 创建离屏 canvas
    const offscreenEl = document.createElement('canvas')
    offscreenEl.width = targetWidth
    offscreenEl.height = targetHeight
    const offscreen = new fabric.StaticCanvas(offscreenEl, {
      width: targetWidth,
      height: targetHeight,
      backgroundColor: '#000000',
    })

    // 计算从源画布到目标画布的缩放
    const scaleX = targetWidth / sourceCanvas.getWidth()
    const scaleY = targetHeight / sourceCanvas.getHeight()

    // 将蒙版对象复制到离屏画布（白色表示蒙版）
    maskObjects.forEach((obj) => {
      if (obj.type === 'path') {
        const pathObj = obj as fabric.Path
        if (pathObj.path) {
          const cloned = new fabric.Path(pathObj.path as unknown as any, {
            left: (obj.left || 0) * scaleX,
            top: (obj.top || 0) * scaleY,
            scaleX: (obj.scaleX || 1) * scaleX,
            scaleY: (obj.scaleY || 1) * scaleY,
            fill: 'transparent',
            stroke: '#ffffff',
            strokeWidth: (obj.strokeWidth || 0) * Math.max(scaleX, scaleY),
            selectable: false,
            evented: false,
          })
          offscreen.add(cloned)
          return
        }
      }

      // 非 path 或无路径数据
      const bounds = obj.getBoundingRect()
      offscreen.add(
        new fabric.Rect({
          left: bounds.left * scaleX,
          top: bounds.top * scaleY,
          width: bounds.width * scaleX,
          height: bounds.height * scaleY,
          fill: '#ffffff',
          stroke: 'transparent',
          selectable: false,
          evented: false,
        })
      )
    })

    offscreen.renderAll()
    const dataUrl = offscreen.toDataURL({ format: 'png', quality: 1.0, multiplier: 1 })
    offscreen.dispose()
    return dataUrl
  }

  // 切换蒙版显示 历史逻辑，暂时没有使用
  const toggleMaskView = useCallback(
    (canvas?: fabric.Canvas) => {
      setShowMask((prev) => {
        const newValue = !prev
        if (newValue && canvas) {
          // 使用 setTimeout 确保状态更新后再调用
          setTimeout(() => {
            updateMaskCanvas(canvas)
          }, 0)
        }
        return newValue
      })
    },
    [updateMaskCanvas]
  )

  // 清空蒙版对象 历史逻辑，暂时没有使用
  const clearMaskObjects = useCallback(() => {
    setMaskObjects([])
    if (maskCanvas.current) {
      maskCanvas.current.clear()
      maskCanvas.current.backgroundColor = '#000000'
      maskCanvas.current.renderAll()
    }
  }, [])

  // 已弃用：添加蒙版对象（当前逻辑未使用）

  // 获取蒙版对象信息
  const getMaskObjectsInfo = useCallback((canvas: fabric.Canvas): MaskObjectInfo[] => {
    return canvas
      .getObjects()
      .filter((obj) => (obj as MaskObject).maskObject)
      .map((obj) => ({
        type: obj.type || 'unknown',
        data: obj.toObject(),
      }))
  }, [])

  // 销毁蒙版画布
  const disposeMaskCanvas = useCallback(() => {
    if (maskCanvas.current) {
      maskCanvas.current.dispose()
      maskCanvas.current = null
    }
    setMaskObjects([])
  }, [])

  // 清理函数
  useEffect(() => {
    return () => {
      disposeMaskCanvas()
    }
  }, [disposeMaskCanvas])

  return {
    maskCanvas,
    showMask,
    maskObjects,
    updateMaskCanvas,
    generateMaskData,
    generateMaskImage,
    toggleMaskView,
    clearMaskObjects,
    getMaskObjectsInfo,
    disposeMaskCanvas,
    setOriginalImageSize,
  }
}
