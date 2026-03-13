import * as fabric from 'fabric'
import { useCallback, useEffect, useRef, useState } from 'react'

interface CanvasStateData {
  objects: any[]
  canvasSize: {
    width: number
    height: number
  }
}

interface useCanvasHistoryReturns {
  undo: () => void
  redo: () => void
  pastStates: string[]
  futureStates: string[]
  saveState: (immediate?: boolean, isInitial?: boolean) => void
  canUndo: boolean
  canRedo: boolean
  clear: () => void
}

const MAX_HISTORY_LENGTH = 10

export const useCanvasHistory = ({
  fabricCanvas,
}: {
  fabricCanvas: fabric.Canvas | null
}): useCanvasHistoryReturns => {
  const pastRef = useRef<string[]>([])
  const futureRef = useRef<string[]>([])
  // 当前状态
  const currentStateRef = useRef<string | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  //是否正在加载状态
  const isLoadingStateRef = useRef<boolean>(false)
  // 防抖定时器
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * 更新撤销/重做按钮
   */
  const updateButtonsState = useCallback(() => {
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(futureRef.current.length > 0)
  }, [])

  /**
   * 当前画布状态
   */
  const getCurrentStateString = useCallback((): string | null => {
    if (!fabricCanvas) return null

    try {
      // 确保背景图片属性正确
      const backgroundImg = fabricCanvas.getObjects().find((obj: any) => obj.name === 'background')
      if (backgroundImg) {
        backgroundImg.set({
          selectable: false,
          evented: false,
          excludeFromExport: false,
        })
      }

      // 只保存非背景对象的状态
      const nonBackgroundObjects = fabricCanvas
        .getObjects()
        .filter((obj: any) => obj.name !== 'background')

      const stateData: CanvasStateData = {
        objects: nonBackgroundObjects.map((obj: any) => obj.toObject()),
        canvasSize: {
          width: fabricCanvas.getWidth(),
          height: fabricCanvas.getHeight(),
        },
      }

      return JSON.stringify(stateData)
    } catch (error) {
      console.warn('获取状态失败:', error)
      return null
    }
  }, [fabricCanvas])

  /**
   * 实际执行保存状态的函数
   * @param action 操作名称
   * @param isInitial 是否是初始化（初始化时不存入 past 栈，只更新 currentState）
   */
  const performSaveState = useCallback(
    (isInitial = false) => {
      if (!fabricCanvas) return

      const newState = getCurrentStateString()
      if (!newState) return

      try {
        if (currentStateRef.current && !isInitial) {
          // 如果历史记录已满，移除最旧的状态
          if (pastRef.current.length >= MAX_HISTORY_LENGTH) {
            pastRef.current.shift()
          }
          pastRef.current.push(currentStateRef.current)
        }

        // 更新当前状态
        currentStateRef.current = newState
        // 清空 future
        futureRef.current = []

        updateButtonsState()
      } catch (error) {
        console.warn('保存状态失败:', error)
      }
    },
    [fabricCanvas, getCurrentStateString, updateButtonsState]
  )

  /**
   * 保存当前状态到历史记录（默认带防抖）
   * @param immediate 是否立即保存（不防抖）
   * @param isInitial 是否是初始化（初始化时不存入 past，只更新 currentState）
   */
  const saveState = useCallback(
    (immediate = false, isInitial = false) => {
      if (!fabricCanvas) return

      // 如果正在加载状态，跳过保存（避免 undo/redo 时触发保存）
      if (isLoadingStateRef.current) {
        return
      }

      if (immediate) {
        // 清除之前的防抖定时器
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
          debounceTimerRef.current = null
        }
        performSaveState(isInitial)
        return
      }

      // 防抖：清除之前的定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      // 设置定时器
      debounceTimerRef.current = setTimeout(() => {
        performSaveState(isInitial)
        debounceTimerRef.current = null
      }, 500)
    },
    [fabricCanvas, performSaveState, updateButtonsState]
  )

  /**
   * 清除除了background以外的对象（通用方法）
   */
  const clearNonBackgroundObjects = useCallback((): void => {
    if (!fabricCanvas) return

    const nonBackgroundObjects = fabricCanvas
      .getObjects()
      .filter((obj: any) => obj.name !== 'background')

    nonBackgroundObjects.forEach((obj: any) => {
      fabricCanvas.remove(obj)
    })
  }, [fabricCanvas])

  /**
   * 恢复单个对象（ text 和 path）
   */
  const restoreObject = (objData: any): void => {
    if (!fabricCanvas) return

    try {
      let obj: fabric.Object | null = null
      const type = (objData.type || '').toLowerCase()

      if (type === 'text' || type === 'itext') {
        const textContent = objData.text || ''
        //这里需要排除type和text属性
        const { type: _, text: __, ...textOptions } = objData
        obj = new fabric.IText(textContent, textOptions)
      } else if (type === 'path') {
        const pathString = Array.isArray(objData.path) ? objData.path.join(' ') : objData.path || ''
        if (pathString) {
          const { type: _, ...pathOptions } = objData
          obj = new fabric.Path(pathString, pathOptions)
        }
      }

      if (obj) {
        fabricCanvas.add(obj)

        // 如果是蒙版对象
        if (objData.maskObject) {
          obj.set({ maskObject: true, selectable: false, evented: false })
        }
      }
    } catch (objError) {
      console.warn('恢复对象失败:', objError, objData)
    }
  }

  /**
   * 加载历史记录状态
   * @param state 要加载的状态
   */
  const loadState = (state: string): void => {
    if (!fabricCanvas) return

    // 设置加载标志，避免触发自动保存
    isLoadingStateRef.current = true

    try {
      const stateData: CanvasStateData = JSON.parse(state)

      // 清空画布中的非背景对象
      clearNonBackgroundObjects()

      // 恢复其他对象
      if (stateData.objects && stateData.objects.length > 0) {
        stateData.objects.forEach((objData: any) => {
          restoreObject(objData)
        })
      }

      // 确保背景图片在最底层
      const finalBackgroundImg = fabricCanvas
        .getObjects()
        .find((obj: any) => obj.name === 'background')
      if (finalBackgroundImg) {
        fabricCanvas.sendObjectToBack(finalBackgroundImg)
        finalBackgroundImg.set({ selectable: false, evented: false })
      }

      fabricCanvas.renderAll()

      // 更新当前状态
      currentStateRef.current = state

      updateButtonsState()
    } catch (error) {
      console.warn('加载状态失败:', error)
    } finally {
      // 延迟重置标志位，确保所有事件处理完成
      setTimeout(() => {
        isLoadingStateRef.current = false
      }, 100)
    }
  }

  /**
   * 撤销
   */
  const undo = () => {
    if (pastRef.current.length > 0 && currentStateRef.current) {
      // 将当前状态保存到 future 栈
      futureRef.current.push(currentStateRef.current)

      // 从 past 栈取出上一个状态
      const previousState = pastRef.current.pop() as string
      if (previousState) {
        loadState(previousState)
      }
    }
  }

  /**
   * 重做
   */
  const redo = () => {
    if (futureRef.current.length > 0 && currentStateRef.current) {
      // 将当前状态保存到 past 栈
      if (pastRef.current.length >= MAX_HISTORY_LENGTH) {
        pastRef.current.shift()
      }
      pastRef.current.push(currentStateRef.current)

      // 从 future 栈取出下一个状态并加载
      const nextState = futureRef.current.pop() as string
      if (nextState) {
        loadState(nextState)
      }
    }
  }

  /**
   * 清空操作：清空画布，并saveState()
   */
  const clear = useCallback(() => {
    if (!fabricCanvas) return
    const nonBackgroundObjects = fabricCanvas
      .getObjects()
      .filter((obj: any) => obj.name !== 'background')
    if (!nonBackgroundObjects.length) {
      return
    }
    try {
      // 先保存当前状态到历史记录（清空之前的状态，用于撤销）
      saveState(true, false)

      // 设置加载标志，避免清空过程中触发自动保存
      isLoadingStateRef.current = true
      // 清空除了背景外的对象
      nonBackgroundObjects.forEach((obj: any) => {
        fabricCanvas.remove(obj)
      })

      // 确保背景图片在最底层
      const finalBackgroundImg = fabricCanvas
        .getObjects()
        .find((obj: any) => obj.name === 'background')
      if (finalBackgroundImg) {
        fabricCanvas.sendObjectToBack(finalBackgroundImg)
        finalBackgroundImg.set({ selectable: false, evented: false })
      }

      fabricCanvas.renderAll()
    } catch (error) {
      console.warn('清空操作失败:', error)
    } finally {
      // 延迟重置标志位并保存空状态，确保所有事件处理完成
      setTimeout(() => {
        isLoadingStateRef.current = false
        // 保存清空后的空状态（立即保存，不防抖）
        saveState(true, false)
      }, 100)
    }
  }, [fabricCanvas, clearNonBackgroundObjects, saveState])

  // 监听画布事件，自动保存状态
  useEffect(() => {
    if (!fabricCanvas) return

    // 元素添加事件
    const handleObjectAdded = (e: any) => {
      const obj = e.target
      // 排除背景对象和正在绘制中的对象
      if (obj && (obj as any).name !== 'background' && !obj.isDrawing) {
        saveState()
      }
    }

    const handleObjectModified = (e: any) => {
      const obj = e.target
      if (obj && (obj as any).name !== 'background') {
        saveState()
      }
    }

    const handleObjectRemoved = (e: any) => {
      const obj = e.target
      if (obj && (obj as any).name !== 'background' && !(obj as any).isDrawing) {
        saveState()
      }
    }

    fabricCanvas.on('object:added', handleObjectAdded)
    fabricCanvas.on('object:modified', handleObjectModified)
    fabricCanvas.on('object:removed', handleObjectRemoved)

    // 清理函数
    return () => {
      pastRef.current = []
      futureRef.current = []
      currentStateRef.current = null
      // 清除防抖定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      fabricCanvas.off('object:added', handleObjectAdded)
      fabricCanvas.off('object:modified', handleObjectModified)
      fabricCanvas.off('object:removed', handleObjectRemoved)
      // fabricCanvas.off("mouse:up", handleMouseUp);
    }
  }, [fabricCanvas, saveState])

  return {
    saveState,
    undo,
    redo,
    pastStates: pastRef.current,
    futureStates: futureRef.current,
    canUndo,
    canRedo,
    clear,
  }
}
