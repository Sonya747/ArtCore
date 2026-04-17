"use client"
import { cn } from '@/utils/cn'
import SidebarMenu from './sidebar-menu'

const Sidebar = () => {
  const collapsed = false;
  return (
    <div
      className={cn(
        'bg-sider-bg-color',
        'box-content border-r border-line-color pt-10',
        'flex h-full flex-col overflow-hidden shrink-0 w-30 items-center',
        'transition-all ease-initial duration-250',
        'will-change-width transform-gpu',
        'min-w-10'
      )}
    >
      <SidebarMenu siderCollapsed={collapsed} />
      {/* <SidebarFooter siderCollapsed={collapsed} /> */}
    </div>
  )
}

export default Sidebar
