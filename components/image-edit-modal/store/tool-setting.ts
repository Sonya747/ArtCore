import { create } from 'zustand'
/**
 * 操作工具
 */
export type Tool = 'select' | 'brush' | 'text' | 'rectangle' | 'arrow' | 'eraser' | 'mask'
export interface ToolStore {
  tool: Tool
  color: string
  brushWidth: number
  fontSize: number
  textContent: string
  setTool: (tool: Tool) => void
  setColor: (color: string) => void
  setBrushWidth: (width: number) => void
  setFontSize: (size: number) => void
  setTextContent: (content: string) => void
  resetToolStore: () => void
}

/**
 * 操作工具store
 * 状态：工具类型、笔刷颜色、笔刷大小、字体颜色
 *
 * 这里是全局状态，但仅组件内部使用；后续考虑优化
 */
export const useToolStore = create<ToolStore>((set) => ({
  tool: 'brush',
  color: '#000000',
  brushWidth: 10,
  fontSize: 10,
  textContent: '',
  setTool: (tool: Tool) => {
    set({ tool })
    //重置文字内容
    set({ textContent: '' })
  },
  setColor: (color: string) => set({ color }),
  setBrushWidth: (width: number) => set({ brushWidth: width }),
  setFontSize: (size: number) => set({ fontSize: size }),
  setTextContent: (content: string) => set({ textContent: content }),
  resetToolStore: () =>
    set({
      tool: 'select',
      color: '#000000',
      brushWidth: 10,
      fontSize: 10,
      textContent: '',
    }),
}))
