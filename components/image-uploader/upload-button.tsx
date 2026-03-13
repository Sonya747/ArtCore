import { cn } from '../../utils/cn'
import IconFont from '../icon-font'

export interface UploadButtonProps {
  /** 自定义类名 */
  className?: string
  /** 是否支持多选 */
  multiple?: boolean
  /** 接受的文件类型 */
  accept?: string
  /** 是否hover高亮 */
  hoverHighlight?: boolean
  /** 文件选择回调 */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** 点击回调（可用于拦截默认行为） */
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void
  /** 自定义子内容，默认显示 + 图标 */
  children?: React.ReactNode
}

/**
 * 图片上传按钮组件
 */
const UploadButton = ({
  className = 'w-29 h-29',
  multiple = false,
  accept = 'image/jpeg,image/png',
  hoverHighlight = false,
  onChange,
  onClick,
  children,
}: UploadButtonProps) => {
  return (
    <label
      className={cn(
        'relative rounded-md border border-dashed',
        'border-[#CDD2D6] dark:border-gray-600',
        'bg-[#F0F2F5] dark:bg-[#2a2a2a]',
        'flex items-center justify-center cursor-pointer',
        'group-hover/uploader:border-primary-color',
        'transition-colors',
        hoverHighlight && 'hover:border-primary-color',
        className
      )}
    >
      <input
        type='file'
        accept={accept}
        multiple={multiple}
        className='hidden!'
        onChange={onChange}
        onClick={(e) => {
          // 清空 value，确保选择同一文件时也能触发 onChange
          e.currentTarget.value = ''
          onClick?.(e)
        }}
      />
      {children ?? (
        <IconFont type='icon-plus' className='text-base text-[#606E76] dark:text-gray-400' />
      )}
    </label>
  )
}

export default UploadButton
