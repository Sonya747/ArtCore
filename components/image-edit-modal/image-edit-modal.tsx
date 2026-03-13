import { Modal } from 'antd'
import ImageEditor, { type CanvasResult, type ImageEditorProps } from './image-editor'

// 导出类型
export type { CanvasResult } from './image-editor'

export interface ImageEditModalProps {
  /** 是否显示 Modal */
  open: boolean
  /** 图片 URL */
  imageUrl: string
  /** 编辑模式：edit 编辑模式，mask 蒙版模式 */
  mode?: 'edit' | 'mask'
  /** 保存回调 */
  onSave?: (canvasResult: CanvasResult) => void
  /** 取消回调 */
  onCancel?: () => void
  /** 是否显示footer，默认为 true */
  showFooter?: boolean
  /**  图片编辑器参数，时间原因先这样写 */
  imageEditorProps?: Omit<
    ImageEditorProps,
    'imageUrl' | 'mode' | 'onSave' | 'showSubmitButton' | 'showFooter' | 'onCancel'
  >
}

export default function ImageEditModal({
  open,
  imageUrl,
  mode = 'edit',
  onSave,
  onCancel,
  showFooter = true,
  imageEditorProps,
}: ImageEditModalProps) {
  return (
    <Modal
      open={open}
      onCancel={() => {
        onCancel?.()
      }}
      title='图片编辑器'
      width={1200}
      height={692}
      footer={null}
      destroyOnHidden={true}
    >
      <ImageEditor
        imageUrl={imageUrl}
        mode={mode}
        onSave={onSave}
        onCancel={onCancel}
        showSubmitButton={false}
        showFooter={showFooter}
        {...imageEditorProps}
      />
    </Modal>
  )
}
