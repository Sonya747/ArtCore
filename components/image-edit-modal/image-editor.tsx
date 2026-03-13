import { Button, message, Spin } from 'antd'
import { useEffect, useRef, useState } from 'react'
import GradientButton, { PRIMARY_GRADIENT_BUTTON_CLASSNAME } from '@/components/gradient-button'
import IconFont from '@/components/icon-font'
import { useCanvasHistory } from '@/components/image-edit-modal/hooks/use-canvas-history'
import { useImageEdit } from '@/components/image-edit-modal/hooks/use-main-canvas'
import { useMask } from '@/components/image-edit-modal/hooks/use-mask'
import { useTool } from '@/components/image-edit-modal/hooks/use-tool'
import { useZoom } from '@/components/image-edit-modal/hooks/use-zoom'
import { useToolStore } from '@/components/image-edit-modal/store/tool-setting'
import { Sidebar } from './components/sidebar'

/**
 * 画布结果
 * 编辑模式下返回编辑后图片DataURL
 * 蒙版模式下返回蒙版DataURL
 */
export interface CanvasResult {
  imageDataURL?: string
  maskImageDataURL?: string
}

export interface ImageEditorProps {
  /** 图片 URL */
  imageUrl: string
  /** 编辑模式：edit 编辑模式，mask 蒙版模式 */
  mode?: 'edit' | 'mask'
  /** 保存回调 */
  onSave?: (canvasResult: CanvasResult) => void
  /** 取消回调 */
  onCancel?: () => void
  /** 是否显示提交按钮，默认为 true */
  showSubmitButton?: boolean
  /** 是否显示底部按钮栏，默认为 false */
  showFooter?: boolean
}

export default function ImageEditor({
  imageUrl,
  mode = 'edit',
  onSave,
  onCancel,
  showSubmitButton = true,
  showFooter = false,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // 初始化图片编辑功能
  const { fabricCanvas, canvasSize, isInitialized, downloadImage, exportImage, isLoading } =
    useImageEdit({
      canvasRef,
      containerRef,
      imageUrl,
    })
  const { generateMaskImage } = useMask(fabricCanvas, canvasSize)

  const { zoomIn, zoomOut, zoomReset, zoomLevel } = useZoom({
    canvasRef: containerRef,
    isInitialized,
    baseWidth: 848,
    baseHeight: 596,
  })

  // 历史记录管理
  const { undo, redo, clear, saveState, canUndo, canRedo } = useCanvasHistory({
    fabricCanvas,
  })

  const { setTool } = useToolStore()

  useTool(fabricCanvas, saveState)

  // 根据 mode 设置默认 tool
  useEffect(() => {
    if (mode === 'edit') {
      setTool('brush')
    } else if (mode === 'mask') {
      setTool('mask')
    }
  }, [mode, setTool])

  // 画布初始化后保存初始状态
  useEffect(() => {
    if (isInitialized && fabricCanvas) {
      saveState(true, true)
    }
  }, [isInitialized, fabricCanvas, saveState])

  // 提交loading
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * 提交编辑结果
   */
  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true)
    try {
      if (mode === 'edit') {
        const imageDataURL = exportImage()
        onSave?.({
          imageDataURL,
        })
      } else {
        const maskImageDataURL = generateMaskImage()
        if (!maskImageDataURL) {
          message.error('未检测到蒙版，请在编辑器中绘制蒙版')
          throw new Error('未检测到蒙版，请在编辑器中绘制蒙版')
        }
        onSave?.({
          maskImageDataURL,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='flex flex-row' style={{ height: '694px' }}>
      {/* 左侧工具栏 */}
      <div className='w-[280px] mr-6'>
        <Sidebar mode={mode} />
      </div>

      {/* 右侧内容区 */}
      <div className='flex flex-col flex-1 overflow-hidden'>
        {/* 顶部栏 */}
        <div className='h-8 flex items-center justify-between mb-4'>
          <div className='flex flex-row gap-4'>
            <Button
              onClick={undo}
              disabled={!canUndo}
              icon={
                <IconFont
                  type='icon-undo'
                  className={`${!canUndo ? 'text-[#D0D4D6]! ' : 'text-[#606E76] dark:text-white'}`}
                />
              }
              size='middle'
              variant='filled'
              title='撤销'
              color='default'
              className='border-none! dark:bg-[#2C363D]!'
            >
              <span
                className={`${!canUndo ? 'text-[#D0D4D6]' : 'text-block-title-color dark:text-white'}`}
              >
                撤&nbsp;销
              </span>
            </Button>
            <Button
              onClick={redo}
              disabled={!canRedo}
              icon={
                <IconFont
                  type='icon-redo'
                  className={`${!canRedo ? 'text-[#D0D4D6]!' : 'text-[#606E76] dark:text-white'}`}
                />
              }
              size='middle'
              variant='filled'
              title='恢复'
              color='default'
              className='border-none! dark:bg-[#2C363D]!'
            >
              <span
                className={`${!canRedo ? 'text-[#D0D4D6]' : 'text-block-title-color dark:text-white'}`}
              >
                恢&nbsp;复
              </span>
            </Button>
            <Button
              onClick={clear}
              icon={<IconFont type='icon-delete' className='text-[#F84D6A]!' />}
              size='middle'
              variant='filled'
              title='清空'
              color='default'
            >
              <span className={'text-[#F84D6A]'}>清&nbsp;空</span>
            </Button>
          </div>

          <div className='flex flex-row gap-6'>
            {/* 缩放按钮 */}
            <div className='flex flex-row gap-4 items-center'>
              <IconFont
                type='icon-a-zoomout'
                className='text-button-text-color! text-[16px]'
                onClick={zoomOut}
              />
              <span className='text-[14px]'>{`${zoomLevel}%`}</span>
              <IconFont
                type='icon-a-zoomin'
                className='text-button-text-color! text-[16px]'
                onClick={zoomIn}
              />
            </div>
            <IconFont
              type='icon-zoom'
              className='text-button-text-color! text-[16px]'
              onClick={zoomReset}
            />
            <GradientButton
              gradient='secondary'
              onClick={downloadImage}
              size='middle'
              color='primary'
              icon={<IconFont type='icon-download' />}
              variant='filled'
            >
              下&nbsp;载
            </GradientButton>
            {showSubmitButton && (
              <Button
                onClick={handleSubmit}
                size='middle'
                className={PRIMARY_GRADIENT_BUTTON_CLASSNAME}
                loading={isSubmitting}
                variant='filled'
              >
                保&nbsp;存
              </Button>
            )}
          </div>
        </div>

        {/* 图片编辑器 */}
        <div className='flex-1 bg-page-bg-color overflow-auto w-[848px] h-[596px]'>
          <div id='zoom-wrapper' className='flex items-center justify-center'>
            <div
              ref={containerRef}
              className='flex items-center justify-center'
              style={{ width: '848px', height: '596px' }}
            >
              <Spin spinning={isLoading}>
                <canvas ref={canvasRef as React.RefObject<HTMLCanvasElement>} />
              </Spin>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        {showFooter && (
          <div className='flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <Button onClick={onCancel} size='middle' variant='filled' color='default'>
              取&nbsp;消
            </Button>
            <Button
              onClick={handleSubmit}
              size='middle'
              className={PRIMARY_GRADIENT_BUTTON_CLASSNAME}
              loading={isSubmitting}
              variant='filled'
            >
              保&nbsp;存
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
