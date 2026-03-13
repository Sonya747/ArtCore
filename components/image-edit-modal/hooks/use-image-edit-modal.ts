import { useState } from 'react'
import type { CanvasResult, ImageEditModalProps } from '../image-edit-modal'

export interface UseImageEditModalReturn {
  modalProps: ImageEditModalProps
  openModal: ({
    imageUrl,
    mode,
    onSave,
    onCancel,
  }: {
    imageUrl: string
    mode: 'edit' | 'mask'
    onSave?: (canvasResult: CanvasResult) => void
    onCancel?: () => void
  }) => void
  closeModal: () => void
}

/**
 * ImageEditModal hooks
 * @param
 *  imageUrl: 图片url
 * @returns {
 *  props: 图片编辑modal的props
 *  openModal: 打开modal
 *  closeModal: 关闭modal
 * }
 */
export function useImageEditModal(): UseImageEditModalReturn {
  const [modalProps, setModalProps] = useState<ImageEditModalProps>({
    open: false,
    imageUrl: '',
    mode: 'edit',
  })

  const openModal = ({
    imageUrl,
    mode,
    onSave,
    onCancel,
  }: {
    imageUrl: string
    mode: 'edit' | 'mask'
    onSave?: (canvasResult: CanvasResult) => void
    onCancel?: () => void
  }) => setModalProps({ open: true, imageUrl, mode, onSave, onCancel })

  const closeModal = () =>
    setModalProps({
      open: false,
      imageUrl: '',
      mode: 'edit',
      onSave: undefined,
      onCancel: undefined,
    })

  return {
    modalProps,
    openModal,
    closeModal,
  }
}
