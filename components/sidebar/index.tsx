"use client"
import { cn } from '@/utils/cn'
import SidebarFooter from './sidebar-footer'
import SidebarHeader from './sidebar-header'
import SidebarMenu from './sidebar-menu'

const Sidebar = () => {
  const collapsed = false;
  return (
    <div
      className={cn(
        'bg-sider-bg-color',
        'box-content border-r border-line-color',
        'flex flex-col h-screen overflow-hidden shrink-0',
        'transition-all ease-initial duration-250',
        'will-change-width transform-gpu',
        'min-w-10'
      )}
    >
      
      <SidebarHeader siderCollapsed={collapsed} />
      <SidebarMenu siderCollapsed={collapsed} />
      {/* <SidebarFooter siderCollapsed={collapsed} /> */}
    </div>
  )
}

export default Sidebar
