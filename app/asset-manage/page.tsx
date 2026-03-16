"use client"

import { Breadcrumb } from "antd"
import { useRef, useState } from "react"
import AlbumGallery from "./components/album-area/album-gallery"
import WorkGallery from "./components/work-area/work-gallery"

export default function Page() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [albumId, setAlbumId] = useState<string | undefined>(undefined)
  const [albumName, setAlbumName] = useState<string | undefined>(undefined)

  return (
    <div className="flex h-full max-h-screen flex-col bg-default-bg-color">
      {/* 顶部标题 + 面包屑 */}
      <div className="flex h-16 items-center justify-between gap-4 px-6 py-4">
        <Breadcrumb
          className="text-xl font-medium"
          items={[
            { title: "空间资产" },
            ...(albumName ? [{ title: albumName }] : []),
          ]}
        />
      </div>

      {/* 主体内容：上方专辑区域 + 下方作品区域 */}
      <div
        ref={containerRef}
        className="flex flex-1 flex-col overflow-y-auto px-6 scrollbar-thin scrollbar-auto-hide scrollbar-stable"
      >
        {/* album-area */}
        <AlbumGallery
          onAlbumSelect={(id, name) => {
            setAlbumId(id)
            setAlbumName(name)
          }}
        />

        {/* work-area */}
        <WorkGallery albumId={albumId} containerRef={containerRef} />
      </div>
    </div>
  )
}

