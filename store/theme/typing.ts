export type ThemeMode = 'light' | 'dark'

/**
 * 主题状态管理接口
 */
export interface ThemeStore {
  /** 当前主题模式 */
  theme: ThemeMode
  /** 设置主题模式 */
  setTheme: (theme: ThemeMode) => void
  /**同步系统设置 */
  syncWithSystem: () => void

}
