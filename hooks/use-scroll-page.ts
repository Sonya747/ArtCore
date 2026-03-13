import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useScrollPagination<T>({
  fetchPage, // async (page, pageSize, signal?) => { list, total? }
  pageSize = 20,
  threshold = 200, // 距底部多少 px 触发加载
  enabled = true,
  manual = false, // 是否手动触发第一次加载
  deps = [], // 依赖变化后重置
  containerRef,
}: {
  fetchPage: (
    page: number,
    pageSize: number,
    signal?: AbortSignal
  ) => Promise<{ list: T[]; total?: number; hasMore?: boolean }>
  pageSize?: number
  threshold?: number
  enabled?: boolean
  manual?: boolean
  deps?: any[]
  containerRef?: React.RefObject<HTMLDivElement | null>
}) {
  const fetchPageRef = useRef(fetchPage)
  const loadingRef = useRef(false)
  const noMoreRef = useRef(false)
  // AbortController 用于取消请求
  const abortControllerRef = useRef<AbortController | null>(null)

  const [data, setData] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [noMore, setNoMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // 保持 fetchPage 最新引用
  useEffect(() => {
    fetchPageRef.current = fetchPage
  }, [fetchPage])

  /** 加载指定页 */
  const loadPage = useCallback(
    async (p: number) => {
      if (!enabled) return
      // 使用 ref 检查状态，避免闭包问题
      if (loadingRef.current || noMoreRef.current) return

      // 创建新的 AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      loadingRef.current = true
      setLoading(true)
      setError(null)

      try {
        const { list, total, hasMore } = await fetchPageRef.current(p, pageSize, controller.signal)

        // 如果请求被取消，直接返回
        if (controller.signal.aborted) return

        if (!Array.isArray(list)) throw new Error('fetchPage must return { list }')
        if (typeof hasMore === 'undefined') {
          setNoMore(!(total && total >= (p + 1) * pageSize))
          noMoreRef.current = !(total && total >= (p + 1) * pageSize)
        } else {
          setNoMore(!hasMore)
          noMoreRef.current = !hasMore
        }
        setData((prev) => {
          const newData = [...prev, ...list]
          return newData
        })
        setPage(p + 1)
      } catch (err) {
        // 忽略取消请求的错误
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        setError(err as Error)
      } finally {
        // 只有未被取消的请求才更新 loading 状态
        if (!controller.signal.aborted) {
          loadingRef.current = false
          setLoading(false)
        }
      }
    },
    [enabled, pageSize]
  )

  /** 主动加载下一页 */
  const loadMore = useCallback(() => {
    setPage((currentPage) => {
      loadPage(currentPage)
      return currentPage + 1
    })
  }, [loadPage])

  /** 重置并重新加载 */
  const reload = useCallback(() => {
    // 取消之前的请求
    abortControllerRef.current?.abort()
    loadingRef.current = false

    setData([])
    setPage(0)
    setLoading(false)
    noMoreRef.current = false
    setNoMore(false)
    setError(null)

    if (!manual && enabled) {
      loadPage(0)
    }
  }, [manual, enabled, loadPage])

  // 使用 useMemo 创建稳定的依赖标识
  const depsKey = useMemo(() => {
    return deps.map((dep, index) => `${index}:${dep}`).join(',')
  }, deps)

  /** deps 变化时重置 */
  useEffect(() => {
    reload()
  }, [depsKey, reload])

  /** 监听滚动触发加载 */
  useEffect(() => {
    const el = containerRef?.current
    if (!el) return

    const onScroll = () => {
      // 使用 ref 检查状态，避免闭包问题
      if (loadingRef.current || noMoreRef.current) return
      const bottomDistance = el.scrollHeight - el.scrollTop - el.clientHeight

      if (bottomDistance < threshold) {
        setPage((currentPage) => {
          loadPage(currentPage)
          return currentPage + 1
        })
      }
    }

    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [threshold, loadPage, containerRef])

  useEffect(() => {
    if (!manual && enabled) {
      loadPage(0)
    }
  }, [manual, enabled, loadPage])

  return {
    data,
    loading,
    noMore,
    error,
    loadMore,
    reload,
    page,
    setPage,
  }
}
