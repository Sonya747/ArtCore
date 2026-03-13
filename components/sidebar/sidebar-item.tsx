import { Tooltip } from 'antd'
import type React from 'react'
import { DEFAULT_COLLAPSED_MENU_PATHS } from '@/configs/menu'
import Link from 'next/link'

import { cn } from '@/utils/cn'

interface SideItemProps {
  /** 菜单项图标 */
  icon: React.ReactNode
  /** 菜单项标签 */
  label: string
  /** 菜单项唯一标识 */
  itemKey: string
  /** 是否选中 */
  selected?: boolean
  /** 是否收起状态 */
  collapsed?: boolean
}

const SideItem: React.FC<SideItemProps> = ({
  icon,
  label,
  itemKey,
  selected = false,
  collapsed = false,
}) => {
  // const handleClick = () => {
  //   useTaskStore.getState().setTaskDetail(null)
  //   if (DEFAULT_COLLAPSED_MENU_PATHS.includes(`/${itemKey}`)) {
  //     useGlobalStore.getState().setSiderCollapsed(true)
  //   }
  // }

  const itemContent = (
    <Link
      href={`/${itemKey}` as '/'}
      // onClick={handleClick}
      className={cn(
        'h-10 flex items-center py-2 rounded-md cursor-pointer',
        collapsed ? 'justify-center px-0' : 'px-3',
        selected
          ? 'bg-linear-to-r from-[#F3E8FF] to-[#FDE7F4] text-primary-color dark:from-[#BB7CFF] dark:to-[#FF6DCA] dark:text-black!'
          : 'text-neutral-700! dark:text-neutral-300! hover:bg-neutral-50! dark:hover:bg-neutral-800! hover:text-neutral-900! dark:hover:text-white!'
      )}
    >
      <span className={cn('text-base flex items-center justify-center w-5', collapsed ? '' : 'mr-3')}>
        {icon}
      </span>
      {!collapsed && <span className='text-sm font-normal whitespace-nowrap'>{label}</span>}
    </Link>
  )

  // 收起状态时用 Tooltip 包裹
  if (collapsed) {
    return (
      <Tooltip title={label} placement='right'>
        {itemContent}
      </Tooltip>
    )
  }

  return itemContent
}

export default SideItem
