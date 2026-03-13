import { Input, InputNumber, Slider, Space } from 'antd'
import { useToolStore } from '@/components/image-edit-modal/store/tool-setting'
export default function BrushSetting() {
  const { brushWidth, setBrushWidth, tool, fontSize, setFontSize, textContent, setTextContent } =
    useToolStore()

  return (
    <div>
      <div>
        {tool !== 'text' ? (
          <div className='flex flex-col gap-2'>
            <span className='text-[14px] font-medium  dark:text-gray-300'>画笔</span>
            <div className='flex w-full justify-between flex-row items-center'>
              <Slider
                min={1}
                max={50}
                value={brushWidth}
                onChange={setBrushWidth}
                step={1}
                className='w-[156px]'
              />
              <Space.Compact>
                <InputNumber
                  value={brushWidth}
                  className='slider-input-number'
                  onChange={(value) => setBrushWidth(value as number)}
                  variant='filled'
                />
                <span className='bg-[#E6E8EA] dark:bg-[#404B52]  px-[11px] h-[32px] flex items-center rounded-r-md'>
                  px
                </span>
              </Space.Compact>
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            <span className='text-[14px] font-medium  dark:text-gray-300'>文字</span>
            <Input
              value={textContent || ''}
              onChange={(e) => setTextContent(e.target.value)}
              variant='outlined'
            />
            <span className='text-[14px] font-medium  dark:text-gray-300'>字号</span>
            <div className='flex w-full justify-between flex-row items-center'>
              <Slider
                min={1}
                max={50}
                value={fontSize}
                onChange={setFontSize}
                step={1}
                className='w-[156px]'
              />
              <Space.Compact>
                <InputNumber
                  value={fontSize}
                  className='w-[100px] slider-input-number margin-0!'
                  onChange={(value) => setFontSize(value as number)}
                  variant='filled'
                />
                <span className='bg-[#E6E8EA] dark:bg-[#404B52]  px-[11px] h-[32px] flex items-center rounded-r-md'>
                  px
                </span>
              </Space.Compact>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
