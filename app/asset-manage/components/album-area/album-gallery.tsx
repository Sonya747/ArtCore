import { useNavigate } from '@tanstack/react-router'
import { App, Button, Pagination } from 'antd'
import { useEffect, useState } from 'react'
import { PRIMARY_GRADIENT_BUTTON_CLASSNAME } from '@/components/gradient-button'
import IconFont from '@/components/icon-font'
import Search from '@/components/search'
import { ASSETS } from '@/service/assets/typing'
import { useAlbumStore } from '@/store/album'
import Album from './album'
import { AlbumNameModal, type AlbumNameModalType } from './album-modal'
import { usePageSlideAnimation } from './use-page-slide-animation'
import './album-gallery.css' //TODO
import { assetsService } from '@/service/assets'

interface AlbumGalleryProps {
  /**
   * 在新页面中使用时，点击专辑仅切换下方作品列表，而不跳转路由
   */
  onAlbumSelect?: (albumId?: string, albumName?: string) => void
}

const AlbumGallery = ({ onAlbumSelect }: AlbumGalleryProps) => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()

  // 使用 album store
  const { albumListData, loading, page, pageSize, setPage, setKeyword, fetchAlbumList } =
    useAlbumStore()

  // AlbumNameModal 状态
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<AlbumNameModalType>('create')
  const [currentAlbum, setCurrentAlbum] = useState<ASSETS.AlbumInfo | undefined>(undefined)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | undefined>(undefined)

  // 翻页动画
  const { animationClassName, pageKey } = usePageSlideAnimation({
    page,
    loading,
  })

  // 初始化时拉取标签列表（用于专辑展示）
  useEffect(() => {
    fetchAlbumList()
  }, [fetchAlbumList])

  const albums = albumListData?.results || []
  const totalCount = albumListData?.total_count || 0

  const handleSelect = (albumId: string, albumName: string) => {
    const nextAlbumId = selectedAlbumId === albumId ? undefined : albumId
    const nextAlbumName = selectedAlbumId === albumId ? undefined : albumName
    setSelectedAlbumId(nextAlbumId)

    if (onAlbumSelect) {
      onAlbumSelect(nextAlbumId, nextAlbumName)
      return
    }

    if (!nextAlbumId) {
      navigate({
        to: '/asset-manage',
      })
      return
    }

    navigate({
      to: '/asset-management/{-$albumId}',
      params: {
        albumId: nextAlbumId,
      },
      search: {
        albumName: nextAlbumName ?? '',
      },
    })
  }

  /**
   * 打开新建专辑弹窗
   */
  const handleCreateAlbum = () => {
    setModalType('create')
    setCurrentAlbum(undefined)
    setModalOpen(true)
  }

  /**
   * 打开重命名专辑弹窗
   */
  const handleRenameAlbum = (album: ASSETS.AlbumInfo) => {
    if (album.is_default) {
      message.warning('默认专辑不支持重命名')
      return
    }

    setModalType('rename')
    setCurrentAlbum(album)
    setModalOpen(true)
  }

  /**
   * 打开删除专辑弹窗
   */
  const handleDeleteAlbum = (album: ASSETS.AlbumInfo) => {
    if (album.is_default) {
      message.warning('默认专辑不支持删除')
      return
    }

    modal.confirm({
      title: '删除专辑',
      content: '是否删除专辑？删除后，作品仍可在空间资产查看',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        className: PRIMARY_GRADIENT_BUTTON_CLASSNAME,
      },
      cancelButtonProps: {
        variant: 'filled',
        color: 'default',
      },
      onOk: async () => {
        try {
          await handleDelete(album.album_id)
          message.success('专辑删除成功')
          fetchAlbumList()
        } catch (error: any) {
          message.error(error?.message || '删除专辑失败')
        }
      },
    })
  }

  /**
   * 处理创建专辑
   */
  const handleCreate = async (name: string) => {
    await assetsService.createAlbum({
      name,
    })
    fetchAlbumList()
  }

  /**
   * 处理重命名专辑
   */
  const handleRename = async (albumId: string, name: string) => {
    await assetsService.updateAlbum({
      album_id: albumId,
      name,
    })
    fetchAlbumList()
  }

  /**
   * 处理删除专辑
   */
  const handleDelete = async (albumId: string) => {
    await assetsService.deleteAlbum({
      album_id: albumId,
    })
    fetchAlbumList()
  }

  const handleSearch = (value: string) => {
    setKeyword(value) // setKeyword 内部已经会重置 page 到 0
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1) // Pagination 组件从 1 开始，API 从 0 开始
  }

  return (
    <div className='flex flex-col h-62 shrink-0 bg-card-bg-color shadow-sm rounded-lg mb-6'>
      <div className='flex items-center justify-between pt-4 pb-2 px-6'>
        <div className='flex items-center'>
          <h2 className='text-sm font-medium text-block-title-color mr-4'>标签</h2>
          <Search
            placeholder='输入名称搜索标签'
            className='w-66!'
            onSearch={handleSearch}
            allowClear
          />
        </div>
        {/* <Button
          type='link'
          size='small'
          icon={<IconFont type='icon-plus' />}
          onClick={handleCreateAlbum}
        >
          新建标签
        </Button> */}
      </div>

      <div
        key={pageKey}
        className={`px-6 min-h-39 relative overflow-hidden col-span-7 grid grid-cols-7 gap-10 place-items-center ${animationClassName}`}
      >
        {albums.map((album) => (
          <Album
            key={album.album_id}
            album={album}
            onSelect={handleSelect}
            onRename={() => handleRenameAlbum(album)}
            onDelete={() => handleDeleteAlbum(album)}
          />
        ))}
      </div>

      <div className='flex justify-end px-6 pb-2'>
        <Pagination
          simple={{ readOnly: true }}
          total={totalCount}
          pageSize={pageSize}
          current={page + 1}
          onChange={handlePageChange}
          size='small'
        />
      </div>

      {/* 专辑操作弹窗 */}
      <AlbumNameModal
        open={modalOpen}
        type={modalType}
        album={currentAlbum}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => {
          fetchAlbumList()
        }}
        onCreate={handleCreate}
        onRename={handleRename}
      />
    </div>
  )
}

export default AlbumGallery
