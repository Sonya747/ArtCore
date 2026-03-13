import IconFont from '@/components/icon-font'
import type { Tool } from '@/components/image-edit-modal/store/tool-setting'
import { useToolStore } from '@/components/image-edit-modal/store/tool-setting'

const tools: { key: Tool; iconfont: string; label: string }[] = [
  {
    key: 'select',
    iconfont: 'icon-move-one',
    label: '选择',
  },
  {
    key: 'brush',
    iconfont: 'icon-writing',
    label: '画笔',
  },
  {
    key: 'text',
    iconfont: 'icon-font',
    label: '文本',
  },
  {
    key: 'rectangle',
    iconfont: 'icon-square',
    label: '矩形',
  },
  {
    key: 'arrow',
    iconfont: 'icon-a-arrowrightup',
    label: '箭头',
  },
  {
    key: 'eraser',
    iconfont: 'icon-eraser',
    label: '橡皮擦',
  },
  {
    key: 'mask',
    iconfont: 'icon-mask',
    label: '遮罩',
  },
]

const maskTools = tools.filter((tool) => ['select', 'eraser', 'mask'].includes(tool.key))
const editTools = tools.filter((tool) => !['mask'].includes(tool.key))
/**
 * 工具选择器
 */
const ToolPicker = ({ mode }: { mode: 'edit' | 'mask' }) => {
  const { tool, setTool } = useToolStore()
  const availableTools = mode === 'edit' ? editTools : maskTools

  return (
    <div className='pb-8'>
      <span className='text-[14px] font-medium  dark:text-gray-300 leading-[22px] mb-2'>工具</span>
      <div className='grid grid-cols-4 gap-6'>
        {availableTools.map((item) => (
          <button
            type='button'
            key={item.key}
            onClick={() => setTool(item.key)}
            className={`w-12 h-12 flex text-[24px] items-center justify-center rounded-md transition-colors cursor-pointer hover:bg-[#F0F2F5] dark:hover:bg-[#2C363D] active:border-2 active:border-primary-color ${tool === item.key ? 'bg-[#FFF5FD]! dark:bg-[#491583]! dark:border-[#5D13A1]! border-2 border-[#FAE7F7]' : ''}`}
          >
            <IconFont
              type={item.iconfont}
              className={`${tool === item.key ? 'text-primary-color!' : 'text-button-text-color!'}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default ToolPicker
