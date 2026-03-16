import { useState } from 'react'
import FolderCover from '@/assets/images/folder-cover.svg'
import { cn } from '@/utils/cn'
import IconFont from '../icon-font'

interface CoverImageProps {
  url?: string | 'audio-cover'
  order: number
}
interface FolderIconProps {
  coverUrls?: string[]
}

const positionClass = (order: number) =>
  cn(
    'absolute w-15 h-19 skew-y-10',
    order === 0 && 'top-3 left-3.5 z-3',
    order === 1 && 'top-[9px] left-[22px] z-2',
    'border-2 border-white shadow-sm rounded-md'
  )

const FallbackCover = ({ order }: { order: number }) => (
  <div
    className={cn(
      positionClass(order),
      'flex items-center justify-center bg-[#fce7f6]',
      'text-[#c163fb]'
    )}
  >
    <IconFont type='icon-image' className='text-[28px]' />
  </div>
)

const CoverImage = ({ url, order }: CoverImageProps) => {
  const [hasError, setHasError] = useState(false)

  if (url === 'audio-cover') {
    return (
      <div
        className={cn(
          positionClass(order),
          'flex items-center justify-center bg-[#fce7f6]',
          'text-[#c163fb]'
        )}
      >
        <IconFont type='icon-sound' className='text-[28px]' />
      </div>
    )
  }

  if (hasError) {
    return <FallbackCover order={order} />
  }

  return (
    <img
      src={url}
      alt=''
      decoding='sync'
      className={positionClass(order)}
      onError={() => setHasError(true)}
    />
  )
}

/**
 * 文件夹图标组件
 * 显示文件夹图标，内部可以显示最多2张封面图片
 */
const FolderIcon = ({ coverUrls = [] }: FolderIconProps) => {
  return (
    <div className='w-[82px] h-[98px] shrink-0 flex items-center justify-between relative'>
      <FolderCover aria-label='folder cover' className='absolute top-0 left-0 z-4' />
      <div className='w-px h-19.5 bg-[#f8b74e90] border-r-[0.5px] border-r-[#d9d9d93e] absolute top-1.5 left-[2.5px] z-5' />
      <div className='w-px h-19.5 bg-[#f8b74e90] border-r-[0.5px] border-r-[#d9d9d93e] absolute top-2 left-[5px] z-5' />
      {/* image 1 */}
      {coverUrls[0] && <CoverImage url={coverUrls[0]} order={0} />}
      {/* image 2 */}
      {coverUrls[1] && <CoverImage url={coverUrls[1]} order={1} />}
      {/* bottom surface */}
      <div className='absolute top-0 left-0-0 w-15 h-21 bg-[#ee961d] rounded-r-md z-1' />
    </div>
  )
}

export default FolderIcon
