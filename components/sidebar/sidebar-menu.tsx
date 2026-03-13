"use client"
import { Divider } from 'antd'
import { useMemo } from 'react'
import { MENU_CONFIGS } from '../../configs/menu'
import SideItem from './sidebar-item'
import { cn } from '@/utils/cn'
import { usePathname } from 'next/navigation'

interface SidebarMenuProps {
  siderCollapsed: boolean
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ siderCollapsed }) => {
  const pathname = usePathname()

  // 根据当前路由获取选中的菜单项
  const selectedKey = useMemo(() => {
    // 从路径中提取菜单项key
    const pathSegments = pathname.split('/').filter(Boolean)
    return pathSegments[0] || 'resource' // 默认选中空间资产
  }, [pathname])

  return (
    <div className='flex-1 px-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4'>
      {MENU_CONFIGS.map((group, index) => (
        <div key={group.label} className='mb-4'>
          <div
            className={'px-2 mb-2 h-5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap'}
          >
            {siderCollapsed ? (
              <Divider className={cn('my-0! bg-line-color', index === 0 ? 'opacity-0' : '')} />
            ) : (
              group.label
            )}
          </div>
          <div className='flex flex-col gap-1'>
            {group.children.map((item) => (
              <SideItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                itemKey={item.key}
                selected={item.key === selectedKey}
                collapsed={siderCollapsed}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SidebarMenu
