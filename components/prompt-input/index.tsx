import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons'
import { Button, Input } from 'antd'
import { useState } from 'react'

export interface NegativePromptProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  title?: string
  autoExpand?:boolean
}

const { TextArea } = Input

const PromptInput = ({ value, onChange, placeholder, disabled, title ,autoExpand = false}: NegativePromptProps) => {
  const [expanded, setExpanded] = useState<boolean>(autoExpand)

  return (
    <div className='flex flex-col'>
      <div className='flex justify-between items-center mb-2'>
        <div>
          <span className='text-sm font-medium text-block-title-color'>{title ?? '不希望呈现的内容'}</span>
          <span className='text-sm font-medium text-[#AAB3B8] dark:text-gray-500'>（可选）</span>
        </div>
        <Button
          type='link'
          size='small'
          onClick={() => setExpanded((prev) => !prev)}
          className='text-[#606E76]! dark:text-gray-400!'
          icon={
            expanded ? (
              <CaretUpOutlined className='text-xs' />
            ) : (
              <CaretDownOutlined className='text-xs' />
            )
          }
        >
          {expanded ? '收起' : '展开'}
        </Button>
      </div>

      {expanded && (
        <TextArea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={5}
          variant='filled'
          disabled={disabled}
        />
      )}
    </div>
  )
}

export default PromptInput
