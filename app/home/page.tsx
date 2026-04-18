"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { Auth } from "@/service/auth/typing"
import { ls } from "@/utils/localStorage"

type QuickEntry = {
  href: string
  title: string
  description: string
}

const QUICK_ENTRIES: QuickEntry[] = [
  {
    href: "/image-gen",
    title: "图片创作",
    description: "快速进入图像生成与出图任务管理。",
  },
  {
    href: "/chat-gen",
    title: "AI 对话",
    description: "进入多轮对话页，完成文案和创意讨论。",
  },
  {
    href: "/task-manage",
    title: "任务管理",
    description: "查看和跟进创作任务执行进度。",
  },
  {
    href: "/review",
    title: "审批中心",
    description: "处理待审批事项并查看审批记录。",
  },
  {
    href: "/asset-manage",
    title: "空间资产",
    description: "统一管理项目沉淀的数字资产。",
  },
  {
    href: "/member-manage",
    title: "成员管理",
    description: "维护团队成员信息与协作分工。",
  },
]

export default function HomePage() {
  const [userInfo, setUserInfo] = useState<Auth.UserInfo | null>(null)

  useEffect(() => {
    const user = ls.get("user_info") as Auth.UserInfo | null
    setUserInfo(user)
  }, [])

  const displayName = userInfo?.display_name || userInfo?.username || "用户"

  return (
    <main className="h-full overflow-y-auto bg-[#f7f8fa] p-6 md:p-8">
      <section className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm text-[#5f6b7a]">ArtCore 创作平台</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1f2937]">欢迎你，{displayName}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#4b5563]">
          这里是工作入口页，你可以快速了解平台能力，并一键跳转到创作、审批、资产与成员协作等核心模块。
          建议将常用模块加入你的工作流，提升日常使用效率。
        </p>
      </section>

      <section className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {QUICK_ENTRIES.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className="group rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d1d5db] hover:shadow-md"
          >
            <div className="text-lg font-medium text-[#111827]">{entry.title}</div>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">{entry.description}</p>
            <div className="mt-4 text-sm font-medium text-[#2563eb] transition group-hover:text-[#1d4ed8]">
              立即前往 →
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
