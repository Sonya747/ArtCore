import IconFont from '@/components/icon-font'

/**
 * 菜单项配置接口
 */
export interface MenuItemConfig {
  key: string
  icon: React.ReactNode
  label: string
  /** 是否显示侧边栏 */
  showSidebar?: boolean
  /** 是否显示任务栏 */
  showTaskBar?: boolean
}

/**
 * 菜单组配置接口
 */
export interface MenuGroupConfig {
  type: 'group'
  label: string
  children: MenuItemConfig[]
}

/**
 * 菜单配置
 */
export const MENU_CONFIGS: MenuGroupConfig[] = [
  {
    type: 'group',
    label: '创作',
    children: [
      {
        key: 'image-gen',
        icon: <IconFont type='icon-image' />,
        label: '图片创作',
        showSidebar: true,
        showTaskBar: true,
      },
    ],
  },
  {
    type: 'group',
    label: '工作空间',
    children: [
      {
        key: 'asset-management',
        icon: <IconFont type='icon-data' />,
        label: '空间资产',
        showSidebar: true,
        showTaskBar: false,
      },
      {
        key: 'space-management',
        icon: <IconFont type='icon-settings' />,
        label: '空间管理',
        showSidebar: true,
        showTaskBar: false,
      },
    ],
  },
]

/**
 * 特殊页面配置（不在菜单中的页面）
 */
export const SPECIAL_PAGE_CONFIGS: Record<string, Partial<MenuItemConfig>> = {
  '/login': {
    showSidebar: false,
    showTaskBar: false,
  },
  '/unauthorized': {
    showSidebar: false,
    showTaskBar: false,
  },
  '/workflow': {
    showSidebar: true,
    showTaskBar: true,
  },
  '/comfy-ui': {
    showSidebar: true,
    showTaskBar: true,
  },
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: MenuItemConfig = {
  key: '/',
  icon: null,
  label: '默认',
  showSidebar: true,
  showTaskBar: false,
}

export const DEFAULT_COLLAPSED_MENU_PATHS = ['/image-gen', '/chat-gen', '/video-gen', '/audio-gen']

/**
 * 根据路径获取页面布局配置
 */
export const getPageLayoutConfig = (pathname: string): MenuItemConfig => {
  // 特殊页面配置
  if (SPECIAL_PAGE_CONFIGS[pathname]) {
    return { ...DEFAULT_CONFIG, ...SPECIAL_PAGE_CONFIGS[pathname] }
  }

  // 从菜单配置中查找
  for (const group of MENU_CONFIGS) {
    for (const item of group.children) {
      if (pathname === `/${item.key}` || pathname.startsWith(`/${item.key}/`)) {
        return { ...DEFAULT_CONFIG, ...item }
      }
    }
  }

  // 默认配置
  return DEFAULT_CONFIG
}
