import { useToolStore } from '@/components/image-edit-modal/store/tool-setting'

export default function ColorPicker() {
  // 预定义颜色
  const predefinedColors = [
    '#000000', // 黑
    '#ffffff', // 白
    '#ff0000', // 红
    '#ffff00', // 黄
    '#0000ff', // 蓝
    '#00ff00', // 绿
  ]
  const { color, setColor } = useToolStore()
  return (
    <div>
      <span className='text-[14px] font-medium leading-[22px] dark:text-gray-300 mb-4'>颜色</span>
      <div className='grid gap-8 w-fit' style={{ gridTemplateColumns: 'repeat(4, 32px)' }}>
        {predefinedColors.map((item) => (
          <div
            key={item}
            className={`z-0 w-8 h-8 rounded-full border-2 
              
              ${color === item ? 'border-[rgba(153,13,251,0.2)] dark:border-[rgba(193,99,251,0.2)]' : 'dark:border-[#1F1F1F] border-white'}`}
          >
            <button
              type='button'
              onClick={() => setColor(item)}
              className={`w-full h-full z-1 rounded-full cursor-pointer box-border border-2
                 hover:border-[#AAB3B8] dark:hover:border-[#889096]
                  ${color === item ? 'dark:border-[#C163FB]! border-[#990DFB]!' : 'dark:border-[#404B52] border-[#E6E8EA]'}`}
              style={{
                backgroundColor: item,
                opacity: 1,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
