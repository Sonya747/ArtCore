/**
 * 卡片组件
 * 用于显示作品/comfyUI，可自定义样式、footer、header、select/selected Icon
 * 宽高比固定（默认 3:4），宽度随容器自适应
 * 为什么不用antd的Card：最初的设计为宽高固定（现在改成自适应），antd的Card默认自适应宽度，且除了cover以外的属性用不到
 */

import { useInViewport } from 'ahooks'
import { Checkbox, Dropdown, type MenuProps, Radio } from 'antd'
import { useMemo, useRef } from 'react'
import { cn } from '@/utils/cn'
import IconFont from '../icon-font'

/**
 * 卡片组件属性
 * aspectRatio: 卡片宽高比，默认为 3/4
 *
 * cover: 卡片封面
 *
 * header: 卡片头部，默认为左上角显示avator（如有）
 * avatar: 左上角显示内容，传入自定义header后无效
 *
 * footer: 卡片底部
 * title: 显示在footer上部的文字，传入自定义footer后无效
 * description: 显示在footer下部的文字，传入自定义footer后无效
 * actions: 点击操作按钮显示的表单项，不传就不显示操作按钮
 *
 * selectable: 是否可选择
 * selected: 是否选中
 * onSelect: 选择回调
 *
 * onClick: 点击回调
 */
export interface CardProps {
  /** 宽高比，默认为 3/4 (即 240:320) */
  aspectRatio?: number
  cover?: React.ReactNode
  header?: React.ReactNode
  avatar?: React.ReactNode | string
  icon?: React.ReactNode | string
  title?: React.ReactNode | string
  description?: React.ReactNode | string
  actions?: MenuProps['items']
  footer?: React.ReactNode
  multiple?: boolean
  selectable?: boolean
  selected?: boolean
  onSelect?: (selected: boolean) => void
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  className?: string
  performance?: boolean // 性能优化，开启后会影响视觉效果，默认关闭
  hoverScale?: boolean // 悬停缩放，默认开启
}

const DisplayCard = ({
  aspectRatio = 3 / 4,
  cover,
  header,
  avatar,
  title,
  description,
  actions,
  footer,
  multiple = true,
  selectable,
  selected,
  icon,
  onSelect,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
  performance = false,
  hoverScale = true,
}: CardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [inViewport] = useInViewport(ref, {
    threshold: performance ? 0.15 : 0,
  })

  const headerContent = useMemo(() => {
    if (header) {
      return header
    }
    return (
      !!avatar && (
        <div className='max-w-[calc(100%-20px)] absolute top-2 left-2 px-2 rounded-xl bg-black/45 text-xs leading-[20px] text-white z-10 break-all truncate'>
          {icon}
          {avatar}
        </div>
      )
    )
  }, [header, avatar])
  const footerContent = useMemo(() => {
    if (footer) {
      return <div className='absolute bottom-0 left-0 right-0'>{footer}</div>
    }
    return (
      <div className='absolute bottom-0 left-0 right-0 bg-linear-to-b from-transparent to-black/60 pt-4 '>
        {/* 第一行: 标题 + icon */}
        <div className='flex items-center gap-1 mb-1 px-3'>{title}</div>
        {/* 第二行：描述 + 操作*/}
        {/* 点击操作区域很容易误触卡片整体onclick，所以在底端阻止事件冒泡 */}
        <div
          className='flex items-center justify-between pb-1 px-3'
          onClick={(e) => e.stopPropagation()}
        >
          <div className='text-xs font-medium text-white leading-5 whitespace-nowrap'>
            {description}
          </div>
          {actions && actions.length > 0 && (
            <Dropdown
              menu={{
                items: actions,
                onClick: (info) => {
                  info.domEvent.stopPropagation()
                },
              }}
              trigger={['click']}
              placement='bottomLeft'
            >
              <div
                className='shrink-0 w-4 h-4 flex items-center justify-center cursor-pointer hover:opacity-80 text-white z-10'
                onClick={(e) => e.stopPropagation()}
              >
                <IconFont type='icon-more' className='text-white! text-base' />
              </div>
            </Dropdown>
          )}
        </div>
      </div>
    )
  }, [footer, description, actions, title])

  const checkboxContent = useMemo(() => {
    if (!selectable) {
      return null
    }
    return multiple ? <Checkbox checked={selected} /> : <Radio checked={selected} />
  }, [selected, onSelect, selectable, multiple])

  return (
    <div
      ref={ref}
      className={cn(
        'group relative rounded-xl overflow-hidden cursor-pointer inset-shadow-card hover:shadow-xl w-full',
        selectable && selected && 'border-2 border-primary-color',
        className
      )}
      style={{ aspectRatio }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (selectable) onSelect?.(!selected)
        else onClick?.()
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {cover && inViewport && (
        <div
          className={cn(
            'absolute inset-0 origin-center will-change-transform transition-transform duration-200',
            hoverScale && 'group-hover:scale-105'
          )}
        >
          {cover}
        </div>
      )}
      {headerContent}
      {footerContent}
      {selectable && <div className='absolute top-2 right-2 z-10'>{checkboxContent}</div>}
    </div>
  )
}

export default DisplayCard
