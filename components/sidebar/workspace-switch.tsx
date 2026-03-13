// import { PlusOutlined, SwapOutlined, TeamOutlined } from '@ant-design/icons'
// import { useLocation, useNavigate } from '@tanstack/react-router'
// import type { MenuProps } from 'antd'
// import { Dropdown } from 'antd'
// import type React from 'react'
// import { useState } from 'react'
// import IconFont from '@/components/icon-font'
// // import type { Workspace } from '@/service/workspace/typing'
// import { cn } from '@/utils/cn'
// // import { useGlobalStore } from '../../store/global'
// import CreateWorkspaceModal from './create-workspace-modal'

// interface WorkspaceSwitchProps {
//   collapsed: boolean
// }

// const WorkspaceSwitch: React.FC<WorkspaceSwitchProps> = ({ collapsed }) => {
//   const { currentWorkspace, workspaceList, setCurrentWorkspace } = useGlobalStore()
//   const [createModalOpen, setCreateModalOpen] = useState(false)
//   const navigate = useNavigate()
//   const location = useLocation()

//   const handleWorkspaceChange: MenuProps['onClick'] = ({ key }) => {
//     const workspace = workspaceList.find((ws: Workspace.Workspace) => ws.workspace_id === key)
//     if (key === 'create-workspace') {
//       createWorkspace()
//     } else if (workspace) {
//       setCurrentWorkspace(workspace)

//       if (location.pathname.startsWith('/audio-gen')) {
//         navigate({ to: '/audio-gen/{-$requestId}', params: { requestId: undefined } })
//       }
//     }
//   }

//   const createWorkspace = () => {
//     setCreateModalOpen(true)
//   }

//   const menuItems: MenuProps['items'] = (
//     workspaceList?.map((workspace: Workspace.Workspace) => {
//       const isCurrent = workspace.workspace_id === currentWorkspace?.workspace_id
//       return {
//         key: workspace.workspace_id,
//         label: workspace.name,
//         icon: <TeamOutlined />,
//         className: isCurrent ? 'bg-purple-100 dark:bg-purple-900/60' : '',
//       }
//     }) || []
//   ).concat([
//     {
//       key: 'create-workspace',
//       label: '新建工作空间',
//       icon: <PlusOutlined />,
//       className: '',
//     },
//   ])

//   return (
//     <>
//       <Dropdown
//         menu={{ items: menuItems, onClick: handleWorkspaceChange }}
//         trigger={['click']}
//         className='w-full h-8'
//       >
//         <div
//           className={cn(
//             'cursor-pointer flex justify-between rounded-md px-3 py-1 overflow-hidden',
//             'bg-gray-100 dark:bg-neutral-800',
//             'hover:bg-gray-200 dark:hover:bg-neutral-700',
//             ' min-h-8 transition-colors',
//             collapsed ? 'w-8 grow-0 px-2.5!' : 'flex-1 truncate'
//           )}
//         >
//           {!collapsed && (
//             <div className='flex items-center overflow-hidden'>
//               <IconFont type='icon-work' className='text-button-text-color!' />
//               <span className='ml-2 mr-0.5 text-sm text-gray-700 dark:text-gray-300 truncate'>
//                 {currentWorkspace?.name}
//               </span>
//             </div>
//           )}
//           <SwapOutlined className='inline-block text-button-text-color! text-xs' />
//         </div>
//       </Dropdown>
//       <CreateWorkspaceModal open={createModalOpen} onCancel={() => setCreateModalOpen(false)} />
//     </>
//   )
// }

// export default WorkspaceSwitch
