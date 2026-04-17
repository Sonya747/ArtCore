"use client"

import Logo from "@/assets/logos/logo.svg"
import LogoDark from "@/assets/logos/logo-dark.svg"
import { UserOutlined } from "@ant-design/icons"
import { Avatar } from "antd"
import Link from "next/link"

export default function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-[#eceff3] bg-[#fdfdfd] backdrop-blur">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Logo className="theme-only-light h-9 w-auto" />
          <LogoDark className="theme-only-dark h-9 w-auto" />
          <span className="bg-linear-to-r from-[#2f3542] via-[#4f5d75] to-[#6c7a93] bg-clip-text text-sm font-semibold tracking-[0.2em] text-transparent md:text-base">
            ART-CORE・AI 提示词优化・美术概念设计
          </span>
        </div>

        <Link href="/member-manage" aria-label="成员管理">
          <Avatar
            size={38}
            icon={<UserOutlined />}
            className="cursor-pointer border border-[#d7dce2] bg-white text-[#4b5563] transition hover:shadow-sm"
          />
        </Link>
      </div>
    </header>
  )
}
