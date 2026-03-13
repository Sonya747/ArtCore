/**
 * 检测 URL 是否包含 OSS 签名参数
 * 如果包含签名参数，添加新的查询参数会导致签名失效
 */
export const hasOSSSignature = (url: string): boolean => {
  return (
    url.includes('x-oss-signature') ||
    url.includes('x-oss-signature-version') ||
    url.includes('x-oss-credential') ||
    url.includes('x-oss-date') ||
    url.includes('x-oss-expires')
  )
}

/**
 * 跨域请求配置选项
 */
export interface CorsFetchOptions extends RequestInit {
  /** 是否添加缓存破坏参数，默认 false */
  bustCache?: boolean
  /** 请求超时时间（毫秒），默认 30000 */
  timeout?: number
}

/**
 * 处理 URL，添加缓存破坏参数（如果启用且 URL 不包含 OSS 签名）
 */
const processUrlWithCacheBuster = (url: string, bustCache: boolean): string => {
  if (bustCache && !hasOSSSignature(url)) {
    const separator = url.includes('?') ? '&' : '?'
    const cacheBuster = `_t=${Date.now()}`
    return `${url}${separator}${cacheBuster}`
  }
  return url
}

/**
 * 获取默认的跨域请求配置
 */
const getDefaultCorsOptions = (customHeaders?: HeadersInit): RequestInit => {
  return {
    mode: 'cors',
    credentials: 'omit',
    headers: {
      Accept: '*/*',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      ...((customHeaders as Record<string, string>) || {}),
    },
  }
}

/**
 * 通用的跨域 fetch 函数
 * 自动处理 OSS 签名、缓存破坏、超时控制等
 *
 * @param url - 请求的 URL
 * @param options - 请求选项
 * @param options.bustCache - 是否添加缓存破坏参数，默认 false
 * @param options.timeout - 请求超时时间（毫秒），默认 30000
 * @param options.headers - 自定义请求头
 * @param options.mode - 请求模式，默认 'cors'
 * @param options.credentials - 凭证模式，默认 'omit'
 * @returns Promise<Response> - fetch 响应
 *
 * @example
 * ```typescript
 * // 基础用法
 * const response = await corsFetch('https://example.com/image.png')
 *
 * // 启用缓存破坏
 * const response = await corsFetch('https://example.com/image.png', {
 *   bustCache: true
 * })
 *
 * // 自定义超时和请求头
 * const response = await corsFetch('https://example.com/image.png', {
 *   timeout: 60000,
 *   headers: { 'Custom-Header': 'value' }
 * })
 * ```
 */
export async function corsFetch(url: string, options: CorsFetchOptions = {}): Promise<Response> {
  const { bustCache = false, timeout = 30000, headers, ...fetchOptions } = options

  // 1. 处理 URL，添加缓存破坏参数（如果需要且不包含 OSS 签名）
  const finalUrl = processUrlWithCacheBuster(url, bustCache)

  // 2. 配置跨域请求选项
  const defaultOptions = getDefaultCorsOptions(headers)
  const requestOptions: RequestInit = {
    ...defaultOptions,
    ...fetchOptions,
    headers: {
      ...defaultOptions.headers,
      ...((headers as Record<string, string>) || {}),
    },
  }

  // 3. 添加超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(finalUrl, {
      ...requestOptions,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }

    throw error
  }
}
