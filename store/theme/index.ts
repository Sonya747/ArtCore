import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode, ThemeStore } from './typing'
const getSystemTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light"

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}
/**
 * 主题状态管理 Store
 * 使用 zustand 管理全局主题状态，确保所有组件同步更新
 */
export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: getSystemTheme(),
      setTheme: (theme) => {
        // 更新 DOM 属性
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },
      syncWithSystem() {
        const systemTheme = getSystemTheme()
        document.documentElement.setAttribute('data-theme', systemTheme)
        document.documentElement.classList.toggle('dark', systemTheme === 'dark')
        set({ theme: systemTheme })
      },
    }),
    {
      name: 'liclick-theme-store',
      partialize: (state) => ({
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        let theme = state?.theme || 'light'
        // 异常处理
        if (!['light', 'dark'].includes(theme)) theme = 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },
    }
  )
)
