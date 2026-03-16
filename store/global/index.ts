// 全局状态管理
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GlobalStore } from './typing'

export const useGlobalStore = create<GlobalStore>()(
  persist(
    (set) => ({
      userInfo: null,
      siderCollapsed: false,
      workspaceList: [],
      currentWorkspace: null,
      setCurrentWorkspace: (workspace) => {
        set({ currentWorkspace: workspace })
      },
      setWorkspaceList: (workspaceList) => set({ workspaceList }),
      setSiderCollapsed: (collapsed) => set({ siderCollapsed: collapsed }),
      setUserInfo: (userInfo) => set({ userInfo }),
    }),
    {
      name: 'liclick-global-store',
      partialize: (state) => ({
        userInfo: state.userInfo,
        siderCollapsed: state.siderCollapsed,
        workspaceList: state.workspaceList,
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
)
