import { Input } from 'antd'
import type { SearchProps } from 'antd/es/input/Search'
import IconFont from '@/components/icon-font'

export interface SearchComponentProps extends SearchProps {}

/**
 * 搜索组件
 * 继承 Input.Search 的所有 props，并设置默认样式
 */
const Search = ({
  variant = 'filled',
  enterButton,
  classNames,
  ...restProps
}: SearchComponentProps) => {
  const defaultEnterButton = enterButton ?? (
    <IconFont type='icon-search' className='text-button-text-color!' />
  )

  const defaultClassNames = classNames?.button?.root
    ? classNames
    : {
        ...classNames,
        button: {
          ...classNames?.button,
          root: 'bg-[#e6e8ea]! dark:bg-[#303030]! px-2!',
        },
      }

  return (
    <Input.Search
      variant={variant}
      enterButton={defaultEnterButton}
      classNames={defaultClassNames}
      {...restProps}
    />
  )
}

export default Search
