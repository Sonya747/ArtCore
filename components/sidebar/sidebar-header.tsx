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
    <div className="h-[38px] px-1 flex items-center justify-center">
      {siderCollapsed ? (
        <>
          <MiniLogo className="flex-shrink-0 theme-only-light h-5 w-5" />
          <MiniLogoDark className="flex-shrink-0 theme-only-dark h-5 w-5" />
        </>
      ) : (
        <>
          <Logo className="ml-3 theme-only-light h-6" />
          <LogoDark className="ml-3 theme-only-dark h-6" />
        </>
      )}
    </div>
  )
}
