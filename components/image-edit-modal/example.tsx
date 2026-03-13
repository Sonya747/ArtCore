import { Button } from 'antd'
import { useImageEditModal } from '@/components/image-edit-modal/hooks/use-image-edit-modal'
import { ImageEditModal } from './index'

/**
 * 图片编辑器示例
 */
export default function ImageEditModalExample() {
  const { modalProps, openModal, closeModal } = useImageEditModal()
  const imageUrl =
    'https://ai-assets.lilithgames.com/ai-assets/dev/image/2025-10/137f470b91f81ad4e904ecb891d1f2534fc73c2c9e78be83dedf33e99ce122af.png?x-oss-signature-version=OSS4-HMAC-SHA256&x-oss-date=20251105T060618Z&x-oss-expires=28799&x-oss-credential=LTAI5t97DMwhp9N6yuUHDyXJ%2F20251105%2Fcn-shanghai%2Foss%2Faliyun_v4_request&x-oss-signature=149560d994499918728889ac2329613f0a6478611b42fceaaddfccfaccb5ef15'
  return (
    <>
      <Button
        onClick={() =>
          openModal({
            imageUrl,
            mode: 'edit',
            onSave: (canvasResult) => {
              console.log(canvasResult)
              closeModal() //要手动调一下关闭modal
            },
            onCancel: closeModal,
          })
        }
      >
        打开编辑模式
      </Button>
      <ImageEditModal {...modalProps} />
    </>
  )
}
