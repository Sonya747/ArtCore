import { useEffect, useRef, useState } from 'react'

/**
 * Canvas 缩放 hook
 * @param canvasRef - Canvas 元素引用
 * @param isInitialized - Canvas 是否已初始化
 * @param baseWidth - 容器基础宽度
 * @param baseHeight - 容器基础高度
 */
export const useZoom = ({
  canvasRef,
  isInitialized,
  baseWidth,
  baseHeight,
}: {
  canvasRef: React.RefObject<HTMLElement | null>
  isInitialized: boolean
  baseWidth: number
  baseHeight: number
}): {
  zoomIn: () => void
  zoomOut: () => void
  zoomReset: () => void
  zoomLevel: number
} => {
  const scaleRef = useRef<number>(1)
  const [zoomLevel, setZoomLevel] = useState<number>(100)

  const applyScale = (scale: number) => {
    if (!canvasRef.current) return

    const container = canvasRef.current
    const wrapper = container.parentElement
    //外部滚动区域
    const scrollContainer = wrapper?.parentElement
    if (!wrapper || !scrollContainer) return

    const scaledWidth = baseWidth * scale
    const scaledHeight = baseHeight * scale

    // 包装器尺寸,最小为baseWidth x baseHeight,canvas居中，填充padding
    const wrapperWidth = Math.max(scaledWidth, baseWidth)
    const wrapperHeight = Math.max(scaledHeight, baseHeight)

    //内部canvas尺寸，保持原始尺寸，应用transform scale
    Object.assign(container.style, {
      width: `${baseWidth}px`,
      height: `${baseHeight}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
    })
    Object.assign(wrapper.style, {
      width: `${wrapperWidth}px`,
      height: `${wrapperHeight}px`,
      minWidth: `${wrapperWidth}px`,
      minHeight: `${wrapperHeight}px`,
    })

    // 放大后滚动条居中，中心放大效果
    scrollContainer.scrollLeft = Math.max(0, (wrapperWidth - scrollContainer.clientWidth) / 2)
    scrollContainer.scrollTop = Math.max(0, (wrapperHeight - scrollContainer.clientHeight) / 2)
    setZoomLevel(Math.round(scale * 100))
  }

  /**
   * 放大 canvas
   */
  const zoomIn = () => {
    const newScale = Math.min(scaleRef.current * 1.2, 5)
    scaleRef.current = newScale
    applyScale(newScale)
  }

  /**
   * 缩小 canvas
   */
  const zoomOut = () => {
    const newScale = Math.max(scaleRef.current / 1.2, 0.1)
    scaleRef.current = newScale
    applyScale(newScale)
  }

  /**
   * 还原到100%
   */
  const zoomReset = () => {
    scaleRef.current = 1
    applyScale(1)
  }

  // 当 canvas 初始化时重置缩放
  useEffect(() => {
    if (isInitialized) {
      scaleRef.current = 1
      applyScale(1)
    }
  }, [isInitialized])

  return {
    zoomIn,
    zoomOut,
    zoomReset,
    zoomLevel,
  }
}
