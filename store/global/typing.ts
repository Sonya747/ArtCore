import type { Auth } from '@/service/auth/typing'
import type { Workspace } from '@/service/workspace/typing'

export interface GlobalStore {
  userInfo: Auth.UserInfo | null
  setUserInfo: (userInfo: Auth.UserInfo | null) => void
  siderCollapsed: boolean
  setSiderCollapsed: (collapsed: boolean) => void
  workspaceList: Workspace.Workspace[]
  setWorkspaceList: (workspaceList: Workspace.Workspace[]) => void
  currentWorkspace: Workspace.Workspace | null
  setCurrentWorkspace: (workspace: Workspace.Workspace | null) => void
}
