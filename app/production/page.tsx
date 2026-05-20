"use client"

import { App, Card, Empty, Spin, Typography } from "antd"
import dayjs from "dayjs"
import { useCallback, useEffect, useState } from "react"

type ProductionItem = {
  id: string
  prompt: string
  created_at: string
  images: string[]
}

export default function ProductionPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ProductionItem[]>([])

  const loadProductions = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/production", { method: "GET" })
      const data = (await response.json().catch(() => ({}))) as {
        results?: ProductionItem[]
        error?: string
      }
      if (!response.ok) {
        throw new Error(data.error || "加载作品失败")
      }
      setItems(Array.isArray(data.results) ? data.results : [])
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "加载作品失败"
      message.error(errMsg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    void loadProductions()
  }, [loadProductions])

  return (
    <div className="h-full w-full overflow-y-auto bg-page-bg-color">
      <div className="min-h-full w-full p-6">
        <div className="mb-4 text-xl font-medium text-block-title-color">我的作品</div>

        {loading ? (
          <div className="flex h-[280px] items-center justify-center rounded-xl bg-card-bg-color">
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center rounded-xl bg-card-bg-color">
            <Empty description="暂无成功生成的作品" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const cover = item.images[0] || ""
              return (
                <Card
                  key={item.id}
                  hoverable
                  cover={
                    cover ? (
                      <div className="flex h-[220px] w-full items-center justify-center bg-default-bg-color">
                        <img
                          src={cover}
                          alt="作品图片"
                          className="max-h-full max-w-full object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="flex h-[220px] items-center justify-center bg-default-bg-color text-assistant-text-color">
                        无图片
                      </div>
                    )
                  }
                >
                  <Typography.Paragraph
                    className="mb-2!"
                    ellipsis={{ rows: 1, tooltip: item.prompt }}
                  >
                    {item.prompt}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary">
                    创建日期：{dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss")}
                  </Typography.Text>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
