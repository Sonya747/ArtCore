import type { ThemeConfig } from 'antd'
import { theme } from 'antd'

export type ThemeMode = 'light' | 'dark'

/**
 * 获取 antd 主题配置
 * @param mode - 主题模式：'light' | 'dark'
 * @returns antd 主题配置对象
 */
export const getAntdTheme = (mode: ThemeMode = 'light'): ThemeConfig => {
  return {
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: mode === 'dark' ? '#C163FB' : '#990dfb',
      colorInfo: mode === 'dark' ? '#C163FB' : '#990dfb',
      colorTextBase: mode === 'dark' ? '#ffffff' : '#090c0e',
      borderRadius: 8,
      colorBgMask: 'rgba(0, 0, 0, 0.55)',
    },
    components: {
      Button: {
        primaryShadow: 'none',
      },
      Slider: {
        railBg: mode === 'dark' ? '#090C0E' : '#F9FAFC',
        dotBorderColor: mode === 'dark' ? '#850FDF' : '#D38BFF',
        handleActiveOutlineColor: 'transparent',
        trackBg: mode === 'dark' ? '#850FDF' : '#D38BFF',
      },
    },
  }
}

// 导出默认主题配置（浅色模式）
export const antdTheme = getAntdTheme('light')
