import type { IMAGES } from '@/service/images/typing'

/**
 * 图片上传组件属性
 */
export interface ImageUploaderProps {
  /** 标题 */
  title?: string
  /** 描述 */
  subTitle?: React.ReactNode
  /** 最大上传数量 */
  maxCount?: number
  /** 图片列表
   * base: value[] 为图片列表
   * mask: value[0] 为图片，value[1] 为蒙版
   * frame: value[0] 为首帧图，value[1] 为尾帧图
   */
  value?: IMAGES.ImageData[]
  /** 图片变化回调 */
  onChange?: (images: IMAGES.ImageData[]) => void
  /** 提示文本 */
  hint?: string
  /** 操作按钮 : delete, edit, mask */
  actions?: ('delete' | 'edit' | 'mask')[]
  /** 模式 : base, mask，默认base */
  mode?: 'base' | 'mask' | 'frame'
  /** 图片类型选项 */
  imageTypes?: {
    label: string
    value: string
  }[]
  /** 文件大小限制（字节），默认不限制，使用磁盘计算规则（1MB = 1000 * 1000） */
  fileSizeLimit?: number
  /** 像素限制，长和宽必须大于等于该值 */
  pixelLimit?: number
}
