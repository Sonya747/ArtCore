import { type CorsFetchOptions, corsFetch } from './fetch'

const downloadBlob = (blob: Blob, fileName: string) => {
  const link = document.createElement('a')
  link.target = '_blank'
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
/**
 * 下载文件 url和blob二选一
 * @param fileName 文件名
 * @param url 文件URL
 * @param blob 文件Blob
 * @param fetchOptions 请求选项（用于跨域配置等）
 */
export const downloadFile = ({
  fileName,
  url,
  blob,
  fetchOptions,
}: {
  fileName: string
  url?: string
  blob?: Blob
  fetchOptions?: CorsFetchOptions
}) => {
  if (!url && !blob) {
    throw new Error('url和blob不能同时为空')
  }
  if (url) {
    corsFetch(url, fetchOptions)
      .then((res) => res.blob())
      .then((blob) => {
        downloadBlob(blob, fileName)
      })
      .catch((error) => {
        console.error('Failed to download file:', error)
        throw error
      })
  }
  if (blob) {
    downloadBlob(blob, fileName)
  }
}
