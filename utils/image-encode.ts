import { corsFetch } from './fetch'

/**
 * 检查图片文件的像素尺寸是否满足限制
 *
 * @param file - 要检查的图片文件
 * @param pixelLimit - 像素限制值，图片的长和宽必须大于等于该值
 * @returns Promise<boolean> - 是否满足限制
 *
 * @example
 * ```typescript
 * const isValid = await checkImagePixels(file, 512)
 * if (!isValid) {
 *   message.error('图片尺寸不满足要求')
 * }
 * ```
 */
export function checkImagePixels(file: File, pixelLimit: number): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      // 长和宽必须大于等于限制值
      resolve(img.width >= pixelLimit && img.height >= pixelLimit)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(false)
    }
    img.src = url
  })
}

/**
 * 将图片 URL 转换为 Base64 字符串
 *
 * 功能特点：
 * - 自动处理跨域问题（CORS）
 * - 支持缓存破坏，确保获取最新资源
 * - 支持请求超时控制
 * - 默认返回纯 Base64 字符串（不包含 data:image/xxx;base64, 前缀）
 * - 可选择保留完整 data URL 格式
 *
 * @param url - 图片 URL
 * @param options - 配置选项
 * @param options.bustCache - 是否添加缓存破坏参数，默认 true
 * @param options.timeout - 请求超时时间（毫秒），默认 30000
 * @param options.keepPrefix - 是否保留 data URL 前缀，默认 false（破坏前缀，只返回纯 base64）
 * @returns Promise<string> - Base64 字符串或完整的 data URL
 *
 * @example
 * ```typescript
 * // 基础用法（返回纯 base64）
 * const base64 = await urlToBase64('https://example.com/image.png')
 *
 * // 保留前缀（返回完整 data URL）
 * const dataUrl = await urlToBase64('https://example.com/image.png', {
 *   keepPrefix: true
 * })
 * // 返回：data:image/png;base64,iVBORw0KGgo...
 *
 * // 自定义配置
 * const base64 = await urlToBase64('https://example.com/image.png', {
 *   bustCache: true,
 *   timeout: 60000,
 *   keepPrefix: false
 * })
 * ```
 */
export async function urlToBase64(
  url: string,
  options: {
    bustCache?: boolean
    timeout?: number
    keepPrefix?: boolean // 是否保留 data URL 前缀，默认 false（破坏前缀）
  } = {}
): Promise<string> {
  // 类型检查：确保 url 是字符串
  if (typeof url !== 'string') {
    throw new Error(`urlToBase64 expects a string, but received ${typeof url}`)
  }

  const { bustCache = true, timeout = 30000, keepPrefix = false } = options

  // 处理 data URL（已经是 base64）
  if (url.startsWith('data:')) {
    if (keepPrefix) {
      return url
    }
    const base64 = url.split(',')[1]
    if (!base64) {
      throw new Error('Invalid data URL format')
    }
    return base64
  }

  // 处理 blob URL（需要使用 fetch 但不需要缓存破坏）
  if (url.startsWith('blob:')) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          try {
            const result = reader.result as string
            if (keepPrefix) {
              resolve(result)
            } else {
              const base64 = result.split(',')[1]
              if (!base64) {
                throw new Error('Failed to extract base64 data')
              }
              resolve(base64)
            }
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = () => {
          reject(new Error('FileReader error'))
        }
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      throw new Error(
        `Failed to convert blob URL to base64: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // 处理 http/https URL
  // 使用通用的跨域 fetch 函数
  let response: Response
  try {
    response = await corsFetch(url, {
      bustCache,
      timeout,
    })
  } catch (error) {
    throw new Error(
      `Failed to fetch image: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // 5. 将响应转换为 Blob
  const blob = await response.blob()

  // 6. 使用 FileReader 将 Blob 转换为 Base64
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      try {
        const result = reader.result as string
        if (keepPrefix) {
          // 保留完整的前缀：data:image/png;base64,...
          resolve(result)
        } else {
          // 提取纯 Base64 部分（去掉前缀）
          const base64 = result.split(',')[1]
          if (!base64) {
            throw new Error('Failed to extract base64 data')
          }
          resolve(base64)
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('FileReader error'))
    }

    reader.readAsDataURL(blob)
  })
}

/**
 * 将图片 URL 转换为完整的 Data URL（包含前缀）
 *
 * @param url - 图片 URL
 * @param options - 配置选项（同 urlToBase64）
 * @returns Promise<string> - 完整的 Data URL，格式：data:image/xxx;base64,xxx
 *
 * @example
 * ```typescript
 * const dataUrl = await urlToDataURL('https://example.com/image.png')
 * // 返回：data:image/png;base64,iVBORw0KGgo...
 *
 * // 可以直接用于 <img> 标签
 * imgElement.src = dataUrl
 * ```
 */
export async function urlToDataURL(
  url: string,
  options: {
    bustCache?: boolean
    timeout?: number
  } = {}
): Promise<string> {
  // 处理 data URL（已经是完整的 data URL，直接返回）
  if (url.startsWith('data:')) {
    return url
  }

  const { bustCache = true, timeout = 30000 } = options

  // 处理 blob URL（不需要缓存破坏）
  if (url.startsWith('blob:')) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      throw new Error(
        `Failed to convert blob URL to data URL: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // 处理 http/https URL
  // 使用通用的跨域 fetch 函数
  let response: Response
  try {
    response = await corsFetch(url, {
      bustCache,
      timeout,
    })
  } catch (error) {
    throw new Error(
      `Failed to fetch image: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // 5. 将响应转换为 Blob
  const blob = await response.blob()

  // 6. 使用 FileReader 将 Blob 转换为 Data URL（保留前缀）
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 批量将多个图片 URL 转换为 Base64
 *
 * @param urls - 图片 URL 数组
 * @param options - 配置选项
 * @param options.bustCache - 是否添加缓存破坏参数，默认 true
 * @param options.timeout - 单个请求超时时间（毫秒），默认 30000
 * @param options.parallel - 是否并行处理，默认 true
 * @param options.maxConcurrent - 最大并发数，默认 5（仅当 parallel 为 true 时有效）
 * @returns Promise<string[]> - Base64 字符串数组
 *
 * @example
 * ```typescript
 * const urls = [
 *   'https://example.com/image1.png',
 *   'https://example.com/image2.png',
 *   'https://example.com/image3.png'
 * ]
 *
 * // 并行转换（默认）
 * const base64List = await batchUrlToBase64(urls)
 *
 * // 串行转换
 * const base64List = await batchUrlToBase64(urls, { parallel: false })
 *
 * // 限制并发数
 * const base64List = await batchUrlToBase64(urls, { maxConcurrent: 3 })
 * ```
 */
export async function batchUrlToBase64(
  urls: string[],
  options: {
    bustCache?: boolean
    timeout?: number
    parallel?: boolean
    maxConcurrent?: number
  } = {}
): Promise<string[]> {
  const { bustCache = true, timeout = 30000, parallel = true, maxConcurrent = 5 } = options

  if (!parallel) {
    // 串行处理
    const results: string[] = []
    for (let i = 0; i < urls.length; i++) {
      const base64 = await urlToBase64(urls[i], { bustCache, timeout })
      results.push(base64)
    }
    return results
  }

  // 并行处理（带并发控制）
  const results: string[] = []
  const queue = [...urls]
  const processing: Promise<void>[] = []

  const processNext = async (): Promise<void> => {
    while (queue.length > 0) {
      const url = queue.shift()!
      const urlIndex = urls.indexOf(url)
      try {
        const base64 = await urlToBase64(url, { bustCache, timeout })
        results[urlIndex] = base64
      } catch (error) {
        console.error(`Failed to convert ${url}:`, error)
        results[urlIndex] = '' // 失败的用空字符串占位
      }
    }
  }

  // 启动并发任务
  for (let i = 0; i < Math.min(maxConcurrent, urls.length); i++) {
    processing.push(processNext())
  }

  await Promise.all(processing)

  return results
}

export const downLoadImage = (url: string) => {
  return corsFetch(url)
}
