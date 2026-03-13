import { Button, type ButtonProps } from 'antd'
import { cn } from '@/utils/cn'

/**
 * 渐变类型
 */
type GradientType = 'primary' | 'secondary'

/**
 * 自定义按钮组件属性
 */
export interface GradientButtonProps extends ButtonProps {
  /** 渐变类型 */
  gradient?: GradientType
}

export const PRIMARY_GRADIENT_BUTTON_CLASSNAME = cn(
  '!bg-gradient-to-r !from-[#c064f9] !to-[#eb5cac] hover:!from-[rgba(153,13,251,0.8)] hover:!to-[rgba(229,0,118,0.8)] !border-none !text-white',
  'dark:!from-[#990dfb] dark:!to-[#e60077]'
)
export const SECONDARY_GRADIENT_BUTTON_CLASSNAME = cn(
  '!bg-gradient-to-r !from-[#f3e8fe] !to-[#fde7f5] hover:from-[#e6ddf1] hover:to-[#ebdee9] !border-none !text-primary-color',
  'dark:!from-[#BB7CFF] dark:!to-[#FF6DC2] dark:!text-black'
)

export const DISABLED_PRIMARY_GRADIENT_BUTTON_CLASSNAME = cn(
  'opacity-25! hover:opacity-25! hover:!from-[#c064f9] hover:!to-[#eb5cac]',
  'dark:opacity-64! hover:dark:opacity-64! dark:hover:!from-[#990dfb] dark:hover:!to-[#e60077]'
)

export const DISABLED_SECONDARY_GRADIENT_BUTTON_CLASSNAME = cn(
  'opacity-25! hover:opacity-25! hover:!from-[#f3e8fe] hover:!to-[#fde7f5]',
  'dark:opacity-80! dark:from-[#F3E8FF]! dark:to-[#FDE7F4]! hover:dark:from-[#F3E8FF]! hover:dark:to-[#FDE7F4]! hover:dark:opacity-80!'
)

/**
 * 自定义按钮组件
 */
const GradientButton = ({ gradient, className, ...props }: GradientButtonProps) => {
  const getGradientClasses = () => {
    if (gradient === 'primary') {
      return cn(
        PRIMARY_GRADIENT_BUTTON_CLASSNAME,
        props.disabled ? DISABLED_PRIMARY_GRADIENT_BUTTON_CLASSNAME : ''
      )
    }

    if (gradient === 'secondary') {
      return cn(
        SECONDARY_GRADIENT_BUTTON_CLASSNAME,
        props.disabled ? DISABLED_SECONDARY_GRADIENT_BUTTON_CLASSNAME : ''
      )
    }

    return ''
  }

  return <Button {...props} className={cn(getGradientClasses(), className)} />
}

export default GradientButton
