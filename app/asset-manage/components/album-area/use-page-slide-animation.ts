import { useEffect, useRef, useState } from 'react'

export interface UsePageSlideAnimationOptions {
  /**
   * 当前页码
   */
  page: number
  /**
   * 是否正在加载
   */
  loading?: boolean
  /**
   * 动画时长（毫秒），默认 300ms
   */
  duration?: number
}

export interface UsePageSlideAnimationReturn {
  /**
   * 滑动方向：'left' 表示向后翻页，'right' 表示向前翻页
   */
  slideDirection: 'left' | 'right' | null
  /**
   * 是否正在动画中
   */
  isAnimating: boolean
  /**
   * 动画类名，可直接应用到元素上
   */
  animationClassName: string
  /**
   * 用于 key 的值，确保翻页时重新渲染
   */
  pageKey: string
}

/**
 * 翻页滑动动画 Hook
 *
 * 用于检测翻页方向并返回相应的动画类名和状态
 *
 * @example
 * ```tsx
 * const { animationClassName, pageKey } = usePageSlideAnimation({
 *   page,
 *   loading
 * })
 *
 * <div key={pageKey} className={animationClassName}>
 *   {items.map(...)}
 * </div>
 * ```
 */
export function usePageSlideAnimation({
  page,
  loading = false,
  duration = 300,
}: UsePageSlideAnimationOptions): UsePageSlideAnimationReturn {
  const prevPageRef = useRef(page)
  const prevLoadingRef = useRef(loading)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // 检测翻页并触发动画
  useEffect(() => {
    const pageChanged = prevPageRef.current !== page
    const loadingFinished = prevLoadingRef.current && !loading

    // 如果 page 变化了，且（不在加载中 或 刚刚加载完成），则触发动画
    if (pageChanged && (!loading || loadingFinished)) {
      const direction = page > prevPageRef.current ? 'left' : 'right'
      setSlideDirection(direction)
      setIsAnimating(true)
      prevPageRef.current = page
    }

    prevLoadingRef.current = loading
  }, [page, loading])

  // 动画结束后清除状态
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setSlideDirection(null)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isAnimating, duration])

  // 生成动画类名
  const animationClassName = isAnimating
    ? slideDirection === 'left'
      ? 'animate-slide-left'
      : 'animate-slide-right'
    : ''

  return {
    slideDirection,
    isAnimating,
    animationClassName,
    pageKey: `page-${page}`,
  }
}
