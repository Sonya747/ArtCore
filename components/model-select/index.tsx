import { CaretDownFilled } from '@ant-design/icons'
import { Select, type SelectProps } from 'antd'
import ModelIcon from '../model-icon'

const ModelSelect = (props: SelectProps) => {
  const { options = [], ...rest } = props

  const modelOptions = options?.map((option) => {
    const modelName =
      typeof option.label === 'string'
        ? `${option.label}-${option.value}`
        : (option.value?.toString() ?? '')

    return {
      label: (
        <span className='flex items-center gap-2'>
          <ModelIcon model={modelName} />
          {option.label}
        </span>
      ),
      value: option.value,
    }
  })

  return (
    <Select placement='topLeft' suffixIcon={<CaretDownFilled />} options={modelOptions} {...rest} />
  )
}

export default ModelSelect
