import ImageUploaderBase from './image-uploader-base'
import ImageUploaderWithFrame from './image-uploader-with-frame'
import ImageUploaderWithMask from './image-uploader-with-mask'
import type { ImageUploaderProps } from './types'

//  “鼠标悬停可粘贴图片” 悬浮后会替换为紫色文字 “Ctrl+V可粘贴多图” / “Ctrl+V可粘贴图图片”
const ImageUploader = (props: ImageUploaderProps) => {
  const { mode = 'base' } = props

  const _props = {
    ...props,
    hint: props.hint ?? '支持jpg、png格式，鼠标悬停可粘贴图片',
  }

  switch (mode) {
    case 'base':
      return <ImageUploaderBase {..._props} />
    case 'mask':
      return <ImageUploaderWithMask {..._props} />
    case 'frame':
      return <ImageUploaderWithFrame {..._props} />
  }
}

export default ImageUploader
