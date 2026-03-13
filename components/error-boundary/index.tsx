"use client"

import { useEffect, useMemo, useState } from "react"

/**
 * 检测是否为 chunk 加载失败的错误
 */
const isChunkLoadError = (error: Error): boolean => {
  const errorMessage = error.message?.toLowerCase() || ""
  const errorName = error.name?.toLowerCase() || ""

  if (errorName === "chunkloaderror") return true

  const chunkErrorPatterns = [
    "loading chunk",
    "loading css chunk",
    "failed to fetch dynamically imported module",
    "failed to load module script",
    "chunkloaderror",
  ]

  return chunkErrorPatterns.some((pattern) =>
    errorMessage.includes(pattern)
  )
}

type Props = {
  error: Error
  reset: () => void
}

/**
 * Next.js Error Boundary UI
 */
export default function ErrorBoundary({ error, reset }: Props) {
  const [countdown, setCountdown] = useState(10)

  const isChunkError = useMemo(
    () => isChunkLoadError(error),
    [error]
  )

  /**
   * ChunkLoadError 自动刷新
   */
  useEffect(() => {
    if (!isChunkError) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.reload()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isChunkError])

  /**
   * 开发环境直接刷新
   */
  if (isChunkError && process.env.NODE_ENV === "development") {
    window.location.reload()
  }

  /**
   * ChunkLoadError UI
   */
  if (isChunkError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center px-6 bg-default-bg-color z-500 overflow-auto">
        <div className="text-6xl mb-6">🔄</div>

        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
          应用有更新
        </h1>

        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">
          检测到新版本，{countdown}s 后将自动刷新页面
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-1.5 text-sm rounded-full bg-linear-to-r from-[#c064f9] to-[#eb5cac] dark:from-primary-color dark:to-[#e60077] text-white! font-medium shadow-sm hover:shadow-md hover:brightness-110 transition-all cursor-pointer"
        >
          立即刷新
        </button>
      </div>
    )
  }

  /**
   * 调用栈
   */
  const stackTrace = error.stack || ""

  /**
   * 通用错误 UI
   */
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6 bg-default-bg-color z-500 overflow-auto">
      <div className="text-6xl mb-6">😵</div>

      <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
        页面出错了
      </h1>

      <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
        {error.message || "抱歉，页面加载时发生了错误"}
      </p>

      {stackTrace && (
        <div className="mb-6 w-full max-w-2xl">
          <div className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm mb-2">
            错误详情
          </div>

          <pre className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto h-120 whitespace-pre-wrap break-all">
            {stackTrace}
          </pre>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 hover:border-primary-color dark:hover:border-primary-color text-gray-600 dark:text-gray-300 hover:text-primary-color dark:hover:text-primary-color bg-transparent transition-all cursor-pointer"
        >
          重试
        </button>

        <a
          href="/"
          className="inline-flex items-center px-4 py-1.5 text-sm rounded-full bg-linear-to-r from-[#c064f9] to-[#eb5cac] dark:from-primary-color dark:to-[#e60077] text-white! visited:text-white! font-medium shadow-sm hover:shadow-md hover:brightness-110 transition-all no-underline"
        >
          返回首页
        </a>
      </div>
    </div>
  )
}