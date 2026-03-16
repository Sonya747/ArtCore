import bananaIcon from '@/assets/icons/model/banana.webp'
import gpt4oIcon from '@/assets/icons/model/chatgpt.webp'
import doubaoIcon from '@/assets/icons/model/doubao.webp'
import klingIcon from '@/assets/icons/model/kling.webp'
import midjourneyIcon from '@/assets/icons/model/midjourney.webp'
import soraIcon from '@/assets/icons/model/sora.webp'
import veoIcon from '@/assets/icons/model/veo.webp'
import viduIcon from '@/assets/icons/model/vidu.webp'

interface ModelIconProps {
  model: string
  className?: string
  width?: number
  height?: number
}

const ModelIcon = ({ model, className, width = 16, height = 16 }: ModelIconProps) => {
  if (model.includes('banana')) {
    return (
      <img src={bananaIcon} alt='nano_banana_pro' className={className} style={{ width, height }} />
    )
  }
  if (model.includes('doubao') || model.includes('seedance')) {
    return <img src={doubaoIcon} alt='doubao' className={className} style={{ width, height }} />
  }
  if (model.includes('gpt')) {
    return <img src={gpt4oIcon} alt='gpt-4o' className={className} style={{ width, height }} />
  }
  if (model.includes('midjourney')) {
    return (
      <img
        src={midjourneyIcon}
        alt='midjourney-7'
        className={className}
        style={{ width, height }}
      />
    )
  }
  if (model.includes('veo')) {
    return <img src={veoIcon} alt='veo' className={className} style={{ width, height }} />
  }
  if (model.includes('kling')) {
    return <img src={klingIcon} alt='kling' className={className} style={{ width, height }} />
  }
  if (model.includes('sora')) {
    return <img src={soraIcon} alt='sora' className={className} style={{ width, height }} />
  }
  if (model.includes('vidu')) {
    return <img src={viduIcon} alt='vidu' className={className} style={{ width, height }} />
  }
  return null
}

export default ModelIcon
