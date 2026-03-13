import BrushSetting from './brush-setting'
import ColorPicker from './color-picker'
import ToolPicker from './tool-picker'

export const Sidebar = ({ mode }: { mode: 'edit' | 'mask' }) => {
  return (
    <div className='flex flex-col gap-4'>
      <ToolPicker mode={mode} />
      {mode === 'edit' && <ColorPicker />}
      <BrushSetting />
    </div>
  )
}
