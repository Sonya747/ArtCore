"use client"

import { App as AntdApp, ConfigProvider } from "antd"
import zhCN from "antd/es/locale/zh_CN"
import { useTheme } from "@/store/theme"
import { getAntdTheme } from "@/configs/theme"
import { useEffect, useLayoutEffect } from "react"

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = useTheme((state) => state.theme)
  const syncWithSystem = useTheme((s) => s.syncWithSystem)

  useLayoutEffect(() => {
    void useTheme.persist.rehydrate()
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
  
    const handler = () => {
      syncWithSystem()
    }
  
    media.addEventListener("change", handler)
  
    return () => {
      media.removeEventListener("change", handler)
    }
  }, [syncWithSystem])

  return (
    <ConfigProvider
      key={theme}
      theme={getAntdTheme(theme)}
      locale={zhCN}
      variant="filled"
      modal={{
        mask: { blur: false },
      }}
      drawer={{
        mask: { blur: false },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}