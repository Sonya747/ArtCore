"use client"

import Logo from "@/assets/logos/logo.svg"
import LogoDark from "@/assets/logos/logo-dark.svg"
import MiniLogo from "@/assets/logos/mini-logo.svg"
import MiniLogoDark from "@/assets/logos/mini-logo-dark.svg"

export default function SidebarHeader({
  siderCollapsed,
}: {
  siderCollapsed: boolean
}) {
  return (
    <div className="h-[80px] px-1 flex items-center justify-center mb-4">
      <Logo className="ml-3 theme-only-light h-10" />
      <LogoDark className="ml-3 theme-only-dark h-10" />
    </div>
  )
}
