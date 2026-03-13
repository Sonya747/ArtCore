import { useEffect, useRef } from 'react'
import { useToolStore } from '@/components/image-edit-modal/store/tool-setting'
import {
  activateArrowDrawing,
  activateDrawingMode,
  activateEraser,
  activateMaskMode,
  activateRectangleDrawing,
  activateTextMode,
  setObjectsCursor,
  setObjectsSelectable,
} from '../utils/canvas-util'

/**
 * 工具管理 Hook
 * 根据选择的工具同步修改 canvas 设置
 */
export const useTool = (
  fabricCanvas: any,
  saveState: (immediate?: boolean, isInitial?: boolean) => void
) => {
  const { tool, color, brushWidth, fontSize, textContent, resetToolStore } = useToolStore()
  // 存储事件清理函数
  const cleanupFnRef = useRef<(() => void) | null>(null)

  // 记对象为蒙版
  const addMaskObject = (obj: any) => {
    obj.set({
      maskObject: true,
      selectable: false,
      evented: true,
    })
  }

  /**
   * 应用工具设置到 canvas
   */
  const applyToolSettings = (
    tool: string,
    color: string,
    brushWidth: number,
    fontSize: number,
    textContent: string
  ) => {
    if (!fabricCanvas) {
      console.error('Canvas not ready')
      return
    }

    // 清理之前的事件监听器
    if (cleanupFnRef.current) {
      cleanupFnRef.current()
      cleanupFnRef.current = null
    }

    switch (tool) {
      case 'select':
        // 选择模式
        fabricCanvas.selection = true
        fabricCanvas.isDrawingMode = false
        fabricCanvas.skipTargetFind = false
        fabricCanvas.perPixelTargetFind = true
        setObjectsSelectable(fabricCanvas, true)
        fabricCanvas.hoverCursor = 'move'
        fabricCanvas.moveCursor = 'move'
        fabricCanvas.defaultCursor = 'default'
        setObjectsCursor(fabricCanvas, 'move', 'move')
        break

      case 'brush':
        // 普通绘制模式
        fabricCanvas.selection = false
        fabricCanvas.skipTargetFind = true
        fabricCanvas.perPixelTargetFind = false
        setObjectsSelectable(fabricCanvas, false)
        fabricCanvas.defaultCursor = 'crosshair'
        fabricCanvas.hoverCursor = 'crosshair'
        fabricCanvas.moveCursor = 'crosshair'
        // 启用绘制模式并设置笔刷
        fabricCanvas.isDrawingMode = true
        fabricCanvas.freeDrawingCursor = 'crosshair'
        activateDrawingMode(fabricCanvas, brushWidth, color)
        break

      case 'mask':
        // 蒙版绘制模式
        fabricCanvas.selection = false
        fabricCanvas.skipTargetFind = true
        fabricCanvas.perPixelTargetFind = false
        setObjectsSelectable(fabricCanvas, false)
        fabricCanvas.defaultCursor = 'crosshair'
        fabricCanvas.hoverCursor = 'crosshair'
        fabricCanvas.moveCursor = 'crosshair'
        fabricCanvas.freeDrawingCursor = 'crosshair'
        // 激活蒙版模式并保存清理函数
        cleanupFnRef.current = activateMaskMode(fabricCanvas, brushWidth, addMaskObject)
        break

      case 'eraser':
        // 橡皮擦模式
        fabricCanvas.selection = false
        fabricCanvas.isDrawingMode = false
        fabricCanvas.skipTargetFind = false
        fabricCanvas.perPixelTargetFind = true
        setObjectsSelectable(fabricCanvas, true)

        // 设置鼠标样式
        fabricCanvas.defaultCursor = 'crosshair'
        if (fabricCanvas.upperCanvasEl) {
          ;(fabricCanvas.upperCanvasEl as HTMLCanvasElement).style.cursor = 'crosshair'
        }

        // 激活橡皮擦并保存清理函数
        cleanupFnRef.current = activateEraser(fabricCanvas, brushWidth)
        break

      case 'text':
        // 文本绘制模式
        fabricCanvas.isDrawingMode = false
        fabricCanvas.selection = false
        fabricCanvas.skipTargetFind = false
        fabricCanvas.perPixelTargetFind = true
        setObjectsSelectable(fabricCanvas, true)

        // 设置鼠标样式
        fabricCanvas.defaultCursor = 'text'
        if (fabricCanvas.upperCanvasEl) {
          ;(fabricCanvas.upperCanvasEl as HTMLCanvasElement).style.cursor = 'text'
        }

        // 激活文字模式并保存清理函数
        cleanupFnRef.current = activateTextMode(fabricCanvas, fontSize, textContent, color)
        break

      case 'rectangle':
      case 'arrow':
        // 形状绘制模式
        fabricCanvas.isDrawingMode = false
        fabricCanvas.selection = false
        fabricCanvas.skipTargetFind = false
        fabricCanvas.perPixelTargetFind = true
        setObjectsSelectable(fabricCanvas, false)

        // 设置鼠标样式
        fabricCanvas.defaultCursor = 'crosshair'
        if (fabricCanvas.upperCanvasEl) {
          ;(fabricCanvas.upperCanvasEl as HTMLCanvasElement).style.cursor = 'crosshair'
        }

        cleanupFnRef.current =
          tool === 'rectangle'
            ? activateRectangleDrawing(fabricCanvas, color, brushWidth, saveState)
            : activateArrowDrawing(fabricCanvas, color, brushWidth, saveState)
        break
    }
  }

  useEffect(() => {
    if (fabricCanvas) {
      applyToolSettings(tool, color, brushWidth, fontSize, textContent)
    }
    return () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current()
        cleanupFnRef.current = null
      }
    }
  }, [fabricCanvas, tool, color, brushWidth, fontSize, textContent])

  // 组件卸载时重置工具状态
  useEffect(() => {
    return () => {
      resetToolStore()
    }
  }, [])

  return {
    tool,
    color,
    brushWidth,
    fontSize,
    textContent,
    applyToolSettings,
    addMaskObject,
  }
}
