import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode, ThemeStore } from './typing'

const getSystemTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light"

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

const THEME_STORAGE_KEY = 'liclick-theme-store'

function readPersistedTheme(): { theme: ThemeMode; found: boolean } {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return { theme: 'light', found: false }
    const parsed = JSON.parse(raw) as { state?: { theme?: unknown } }
    const t = parsed.state?.theme
    if (t === 'dark' || t === 'light') return { theme: t, found: true }
  } catch {
    /* ignore */
  }
  return { theme: 'light', found: false }
}

function readDomTheme(): ThemeMode | null {
  const fromDom = document.documentElement.dataset.theme
  if (fromDom === 'dark' || fromDom === 'light') return fromDom
  return null
}

/**
 * 主题状态管理 Store
 * 使用 zustand 管理全局主题状态，确保所有组件同步更新
 *
 * 初始固定为 light，与 SSR 一致，避免 Next + antd 水合时算法不一致（如 Spin SVG）。
 * 客户端在 Providers 中手动 rehydrate；无持久化记录时用 layout 内联脚本写入的 data-theme。
 */
export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
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
      name: THEME_STORAGE_KEY,
      skipHydration: true,
      partialize: (state) => ({
        theme: state.theme,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) return

        const { theme: storedTheme, found: hasPersistedTheme } = readPersistedTheme()
        let theme: ThemeMode = storedTheme
        if (!hasPersistedTheme) {
          const fromDom = readDomTheme()
          if (fromDom) theme = fromDom
        }
        if (!['light', 'dark'].includes(theme)) theme = 'light'

        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', theme === 'dark')

        if (useTheme.getState().theme !== theme) {
          useTheme.setState({ theme })
        }
      },
    }
  )
)
