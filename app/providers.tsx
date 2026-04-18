"use client"

import { App as AntdApp, ConfigProvider } from "antd"
import zhCN from "antd/es/locale/zh_CN"
import { useTheme } from "@/store/theme"
import { getAntdTheme } from "@/configs/theme"
import { useGlobalStore } from "@/store/global"
import { ls } from "@/utils/localStorage"
import { useEffect, useLayoutEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

const PUBLIC_PATHS = ["/login", "/register"]

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const userInfo = useGlobalStore((s) => s.userInfo)
  const setUserInfo = useGlobalStore((s) => s.setUserInfo)
  const [hydrated, setHydrated] = useState(false)

  useLayoutEffect(() => {
    void useGlobalStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return

    const stored = ls.get("user_info")
    if (stored && !userInfo) {
      setUserInfo(stored as any)
      return
    }

    if (!stored && !userInfo) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [hydrated, pathname, userInfo, setUserInfo, router])

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return <>{children}</>
  if (!hydrated) return <>{children}</>
  if (!userInfo && !ls.get("user_info")) return null

  return <>{children}</>
}

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
      <AntdApp>
        <AuthGuard>{children}</AuthGuard>
      </AntdApp>
    </ConfigProvider>
  )
}