import {
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  MoonOutlined,
  ReadOutlined,
  ReloadOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Avatar, Dropdown, Tag, Tooltip } from 'antd'
import type React from 'react'
import { useShallow } from 'zustand/shallow'
import { useTheme } from '@/store/theme'
import { login, logout } from '@/utils/login'
// import WorkspaceSwitch from './workspace-switch'

// 外部链接配置
const EXTERNAL_LINKS = {
  HELP_DOC: 'https://gmailgames.feishu.cn/docx/HVuJdNOhzodDHYxHBXzc4Iddnhg',
  FEEDBACK_GROUP:
    'https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=308r06a4-9525-4dae-8f36-243ca0539c7a',
} as const

interface SidebarFooterProps {
  siderCollapsed: boolean
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ siderCollapsed }) => {
  // const { userInfo } = useGlobalStore(
  //   useShallow((state) => ({
  //     userInfo: state.userInfo,
  //   }))
  // )
  const { setTheme } = useTheme()

  const menuItems: MenuProps['items'] = [
    {
      key: 'theme',
      label: (
        <span className='inline-flex items-center gap-1'>
          <span className='theme-only-light'>浅色模式</span>
          <span className='theme-only-dark'>深色模式</span>
        </span>
      ),
      icon: (
        <span className='inline-flex items-center'>
          <SunOutlined className='theme-only-light' />
          <MoonOutlined className='theme-only-dark' />
        </span>
      ),
      children: [
        {
          key: 'light',
          label: '浅色模式',
          icon: <SunOutlined />,
          onClick: () => setTheme('light'),
        },
        {
          key: 'dark',
          label: '深色模式',
          icon: <MoonOutlined />,
          onClick: () => setTheme('dark'),
        },
      ],
    },
    {
      key: 'feedback',
      label: '加入反馈群',
      icon: <MessageOutlined />,
      onClick: () => {
        window.open(EXTERNAL_LINKS.FEEDBACK_GROUP, '_blank')
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'api_doc',
      label: (
        <span>
          接口文档 <Tag color='blue'>Dev</Tag>
        </span>
      ),
      icon: <FileTextOutlined />,
      onClick: () => {
        window.open('https://test-liclick-v2.gmailgames.com/docs#/', '_blank')
      },
      style: process.env.NODE_ENV === 'development' ? {} : { display: 'none' },
    },
    {
      key: 'relogin',
      label: '重新登录',
      icon: <ReloadOutlined />,
      onClick: () => {
        login()
      },
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: () => {
        logout()
      },
    },
  ]

  /** 打开帮助文档 */
  const handleOpenHelpDoc = () => {
    window.open(EXTERNAL_LINKS.HELP_DOC, '_blank')
  }



  return (
    <div className='flex flex-col gap-4 p-4'>
      {/* 工作区选择器 */}
      {/* <WorkspaceSwitch collapsed={siderCollapsed} /> */}

      {/* 用户信息和操作按钮 */}
      <div className={`flex items-center gap-4 ${siderCollapsed ? 'flex-col' : 'justify-between'}`}>
        {/* 左侧：头像和用户名 */}
        <div className={`flex items-center gap-2 ${siderCollapsed ? 'flex-col' : ''}`}>
          <Dropdown menu={{ items: menuItems }} placement='topRight'>
            <Avatar
              size={32}
              // src={}
              icon={<UserOutlined />}
              className='shrink-0 cursor-pointer'
            />
          </Dropdown>
          {!siderCollapsed && (
            <span className='text-sm text-block-title-color truncate max-w-20'>
              {/* {userInfo?.username || '用户'} */}
              用户aaatodo
            </span>
          )}
        </div>

        {/* 右侧：帮助文档和折叠按钮 */}
        <div className={`flex items-center gap-4 ${siderCollapsed ? 'flex-col' : ''}`}>
          <Tooltip title='帮助文档' placement={siderCollapsed ? 'right' : 'top'}>
            <ReadOutlined
              className='text-base text-button-text-color! cursor-pointer'
              onClick={handleOpenHelpDoc}
            />
          </Tooltip>

        </div>
      </div>
    </div>
  )
}

export default SidebarFooter
