import { Dropdown, type MenuProps } from 'antd'
import { useState } from 'react'
import FolderIcon from '@/components/folder-icon'
import type { ASSETS } from '@/service/assets/typing'
import { cn } from '@/utils/cn'

interface AlbumProps {
  album: ASSETS.AlbumInfo
  onSelect: (albumId: string, albumName: string) => void
  onRename?: () => void
  onDelete?: () => void
}

const Album = ({ album, onSelect, onRename, onDelete }: AlbumProps) => {
  const [isHovered, setIsHovered] = useState(false)

  // 默认专辑不支持重命名和删除
  const menuItems = []
  if (!album.is_default && onRename) {
    menuItems.push({
      label: '重命名',
      key: 'rename',
    })
  }
  if (!album.is_default && onDelete) {
    menuItems.push({
      label: '删除',
      key: 'delete',
    })
  }

  const handleMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    // 阻止事件冒泡到父元素的 onClick
    if (domEvent && 'stopPropagation' in domEvent) {
      domEvent.stopPropagation()
    }

    if (key === 'rename' && onRename) {
      onRename()
    } else if (key === 'delete' && onDelete) {
      onDelete()
    }
  }

  return (
    <div
      className={cn(
        'w-30 h-35 flex flex-col items-center justify-between bg-card-bg-color rounded-lg cursor-pointer py-2 px-2 transition-colors',
        isHovered ? 'bg-neutral-50 dark:bg-neutral-800' : '',
        'active:bg-neutral-100 dark:active:bg-neutral-800'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(album.album_id, album.name)}
    >
      <FolderIcon coverUrls={album.cover_urls} />
      <div className='flex items-center justify-center w-full min-w-0 h-5'>
        <div
          className={cn(
            'text-sm text-block-title-color text-center truncate',
            isHovered && menuItems.length > 0 ? 'max-w-[calc(100%-20px)]' : 'max-w-full'
          )}
          title={album.name}
        >
          {album.name}
        </div>
        {isHovered && menuItems.length > 0 && (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: handleMenuClick,
            }}
            mouseLeaveDelay={0.3}
          >
            <div
              className='h-full font-black text-button-text-color ml-1 shrink-0 hover:text-primary-color'
              onClickCapture={(e) => e.stopPropagation()}
            >
              ···
            </div>
          </Dropdown>
        )}
      </div>
    </div>
  )
}

export default Album
