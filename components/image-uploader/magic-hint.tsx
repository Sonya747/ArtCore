import { useMemo } from 'react'
import { cn } from '@/utils/cn'

export interface MagicHintProps {
  hint?: string
  magicText?: string
  isHover?: boolean
}

/** 判断是否为 Mac 系统 */
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

/**
 * 魔法提示组件
 * 悬浮时将 "鼠标悬停可粘贴图片" 替换为紫色的 "Ctrl+V/Cmd+V可粘贴多图"
 * 需要外层容器添加 `group` 类
 */
const MagicHint = ({
  hint = '',
  magicText = 'Ctrl+V可粘贴多图',
  isHover = false,
}: MagicHintProps) => {
  // 检查是否包含需要替换的文本
  const replaceText = '鼠标悬停可粘贴图片'
  const hasMagicText = hint.includes(replaceText)

  // 根据操作系统显示不同的快捷键
  const displayMagicText = useMemo(() => {
    return isMac ? magicText.replace('Ctrl', 'Cmd') : magicText
  }, [magicText])

  if (!hasMagicText) {
    return <p className='text-xs pt-1 text-[#889096] dark:text-gray-400'>{hint}</p>
  }

  // 分割文本
  const parts = hint.split(replaceText)

  return (
    <p className='text-xs pt-1 text-[#889096] dark:text-gray-400'>
      {parts[0]}
      <span className='relative inline'>
        <span className={cn('group-hover/uploader:hidden', isHover ? 'hidden' : 'inline')}>
          {replaceText}
        </span>
        <span
          className={cn(
            'group-hover/uploader:inline text-primary-color font-medium',
            isHover ? 'inline' : 'hidden'
          )}
        >
          {displayMagicText}
        </span>
      </span>
      {parts[1]}
    </p>
  )
}

export default MagicHint
