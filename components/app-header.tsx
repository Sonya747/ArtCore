"use client"

import Logo from "@/assets/logos/logo.svg"
import LogoDark from "@/assets/logos/logo-dark.svg"
import { UserOutlined } from "@ant-design/icons"
import { Avatar } from "antd"
import Link from "next/link"

export default function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-[#eceff3] bg-[#fdfdfd]/95 backdrop-blur-md dark:border-white/8 dark:bg-[#16181b]/90">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Logo className="theme-only-light h-10" />
          <LogoDark className="theme-only-dark h-10" />
          <div className="flex items-baseline gap-2">
            <span className="bg-linear-to-r from-[#192534] via-[#34445f] to-[#6c4be8] bg-clip-text text-2xl leading-none font-black tracking-[0.08em] text-transparent [text-shadow:0_0_1px_rgba(30,38,52,0.25),0_8px_20px_rgba(100,116,139,0.2)] md:text-[1.9rem] dark:from-[#e4edff] dark:via-[#bbcbff] dark:to-[#d5baff] dark:[text-shadow:0_0_1px_rgba(240,246,255,0.28),0_10px_26px_rgba(126,91,239,0.28)]">
              ART-CORE
            </span>
            <span className="font-(family-name:--font-display-cn) bg-linear-to-r from-[#1f2a38] via-[#43536b] to-[#7e5bef] bg-clip-text text-base tracking-[0.1em] text-transparent [text-shadow:0_0_1px_rgba(35,44,58,0.22),0_6px_16px_rgba(100,116,139,0.16)] md:text-lg dark:from-[#d7e4ff] dark:via-[#a9bbff] dark:to-[#d2b6ff]">
              ・提示词优化・美术概念设计
            </span>
          </div>
        </div>

        <Link href="/member-manage" aria-label="成员管理">
          <Avatar
            size={38}
            icon={<UserOutlined />}
            className="cursor-pointer border border-[#d7dce2] bg-white text-[#4b5563] shadow-[0_6px_18px_rgba(90,106,133,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(90,106,133,0.2)] dark:border-white/10 dark:bg-[#23262c] dark:text-[#d5dbe6] dark:shadow-[0_8px_24px_rgba(8,10,14,0.4)]"
          />
        </Link>
      </div>
    </header>
  )
}
