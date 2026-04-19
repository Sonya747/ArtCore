"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { App, Typography, Badge, Space, Avatar } from "antd"
import {
  Bubble,
  Sender,
  Welcome,
  Prompts,
  Conversations,
} from "@ant-design/x"
import type { BubbleProps, BubbleListProps } from "@ant-design/x"
import { XMarkdown } from "@ant-design/x-markdown"
import {
  RobotOutlined,
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  ReloadOutlined,
  EditOutlined,
} from "@ant-design/icons"

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  status?: "loading" | "success" | "error" | "local"
  streaming?: boolean
  createdAt: number
}

interface ConversationItem {
  key: string
  label: string
  messages: ChatMessage[]
  createdAt: number
}

/* ---------- helpers ---------- */

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`


const WELCOME_PROMPTS = [
  {
    key: "1",
    icon: <EditOutlined style={{ color: "#990dfb" }} />,
    label: "帮我设计一个暗黑风Boss角色概念",
    description: "从轮廓、材质到配色给出完整设定思路",
  },
  {
    key: "2",
    icon: <RobotOutlined style={{ color: "#990dfb" }} />,
    label: "生成一套二次元角色立绘提示词",
    description: "按发型、服装、姿态和光影拆分关键词",
  },
  {
    key: "3",
    icon: <CopyOutlined style={{ color: "#990dfb" }} />,
    label: "给我做一张赛博朋克城市场景分镜",
    description: "包含远中近景元素和镜头运动建议",
  },
  {
    key: "4",
    icon: <ReloadOutlined style={{ color: "#990dfb" }} />,
    label: "分析《原神》角色美术风格特点",
    description: "从形体语言、色彩体系和细节设计拆解",
  },
]


async function fetchChatCompletion(
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/chat-gen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "system", content: "你是一个游戏美术领域的AI助手" }, ...messages],
      stream: false,
      model: "doubao-seed-2-0-lite-260215",
    }),
    signal,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`请求失败: ${res.status} ${text}`)
  }

  const json = await res.json()
  const content = json.choices?.[0]?.message?.content
  if (typeof content !== "string") {
    throw new Error("响应格式异常")
  }
  return content
}

/* ---------- component ---------- */

export default function ChatGenPage() {
  const { message: antMsg } = App.useApp()

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeConvKey, setActiveConvKey] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const activeConv = useMemo(
    () => conversations.find((c) => c.key === activeConvKey) ?? null,
    [conversations, activeConvKey],
  )

  const createConversation = useCallback(
    (firstMessage?: string) => {
      const key = genId()
      const newConv: ConversationItem = {
        key,
        label: firstMessage?.slice(0, 20) || "新对话",
        messages: [],
        createdAt: Date.now(),
      }
      setConversations((prev) => [newConv, ...prev])
      setActiveConvKey(key)
      return key
    },
    [],
  )

  useEffect(() => {
    if (conversations.length === 0) {
      createConversation()
    }
  }, [conversations.length, createConversation])

  const updateMessages = useCallback(
    (convKey: string, updater: (msgs: ChatMessage[]) => ChatMessage[]) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.key === convKey ? { ...c, messages: updater(c.messages) } : c,
        ),
      )
    },
    [],
  )

  const handleSend = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || isGenerating) return

      let convKey = activeConvKey
      if (!convKey) {
        convKey = createConversation(content)
      }

      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content,
        status: "local",
        createdAt: Date.now(),
      }
      const assistantId = genId()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        status: "loading",
        streaming: true,
        createdAt: Date.now(),
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.key !== convKey) return c
          const isDefault = c.label === "新对话"
          return {
            ...c,
            label: isDefault ? content.slice(0, 20) : c.label,
            messages: [...c.messages, userMsg, assistantMsg],
          }
        }),
      )
      setInputValue("")
      setIsGenerating(true)

      const abort = new AbortController()
      abortRef.current = abort

      const history = [
        ...(
          conversations.find((c) => c.key === convKey)?.messages ?? []
        )
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content },
      ]

      try {
        const reply = await fetchChatCompletion(history, abort.signal)
        updateMessages(convKey!, (msgs) =>
          msgs.map((m) =>
            m.id === assistantId
              ? { ...m, content: reply, streaming: false, status: "success" as const }
              : m,
          ),
        )
      } catch (e: any) {
        if (e?.name === "AbortError") return
        const errMsg = e?.message || "请求失败"
        updateMessages(convKey!, (msgs) =>
          msgs.map((m) =>
            m.id === assistantId
              ? { ...m, content: `错误: ${errMsg}`, streaming: false, status: "error" as const }
              : m,
          ),
        )
        antMsg.error(errMsg)
      } finally {
        setIsGenerating(false)
        abortRef.current = null
      }
    },
    [
      activeConvKey,
      isGenerating,
      conversations,
      createConversation,
      updateMessages,
      antMsg,
    ],
  )

  const handleCancel = useCallback(() => {
    abortRef.current?.abort()
    setIsGenerating(false)
  }, [])

  const handleDeleteConversation = useCallback(
    (key: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.key !== key)
        if (activeConvKey === key) {
          setActiveConvKey(next[0]?.key ?? null)
        }
        return next
      })
    },
    [activeConvKey],
  )

  // 聊天气泡列表
  const bubbleItems = useMemo(() => {
    if (!activeConv) return []
    console.log("activeConv", activeConv)
    return activeConv.messages.map((msg) => ({
      key: msg.id,
      role: msg.role,
      content: msg.content,
      loading: msg.status === "loading" && !msg.content,
      ...(msg.status ? { status: msg.status } : {}),
      streaming: msg.streaming,
    }))
  }, [activeConv])

  const roles: BubbleListProps["role"] = useMemo(
    () =>
      ({
        user: {
          placement: "end" as const,
          avatar: <Avatar icon={<UserOutlined />} style={{ background: "#990dfb" }} />,
          variant: "filled" as const,
          shape: "round" as const,
          styles: {
            content: { maxWidth: "70%" },
          },
        },
        assistant: {
          placement: "start" as const,
          avatar: <Avatar icon={<RobotOutlined />} style={{ background: "#333" }} />,
          variant: "borderless" as const,
          typing: { effect: "fade-in" as const, step: 8, interval: 50 },
          contentRender: (content: string) => (
            <Typography>
              <XMarkdown>{typeof content === "string" ? content : ""}</XMarkdown>
            </Typography>
          ),
          styles: {
            content: { maxWidth: "70%" },
          },
        },
      }) as any,
    [],
  )

  // 对话列表
  const conversationItems = useMemo(
    () =>
      conversations.map((c) => ({
        key: c.key,
        label: c.label,
      })),
    [conversations],
  )

  const conversationMenu = useCallback(
    () => ({
      items: [
        {
          label: "删除",
          key: "delete",
          icon: <DeleteOutlined />,
          danger: true,
        },
      ],
      onClick: (menuInfo: any) => {
        if (menuInfo.key === "delete") {
          const convKey = menuInfo.domEvent?.currentTarget
            ?.closest("[data-menu-id]")
            ?.getAttribute("data-menu-id")
          if (convKey) handleDeleteConversation(convKey)
        }
      },
    }),
    [handleDeleteConversation],
  )

  const showWelcome = !activeConv || activeConv.messages.length === 0

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar: Conversations */}
      <div className="w-[260px] shrink-0 border-r border-(--color-line) bg-(--color-bg-container) flex flex-col overflow-hidden">
        <div className="p-3 border-b border-(--color-line)">
          <Space className="w-full justify-between">
            <Typography.Text strong>对话列表</Typography.Text>
            <Badge count={conversations.length} size="small" color="#990dfb" />
          </Space>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Conversations
            items={conversationItems}
            activeKey={activeConvKey ?? undefined}
            onActiveChange={(key) => setActiveConvKey(key)}
            menu={(conversation) => ({
              items: [
                {
                  label: "删除",
                  key: "delete",
                  icon: <DeleteOutlined />,
                  danger: true,
                },
              ],
              onClick: (menuInfo: any) => {
                if (menuInfo.key === "delete") {
                  handleDeleteConversation(conversation.key as string)
                }
              },
            })}
            creation={{
              label: "新对话",
              icon: <PlusOutlined />,
              onClick: () => createConversation(),
            } as any}
          />
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {showWelcome ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
              <Welcome
                icon={
                  <img
                    src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
                    alt="logo"
                    style={{ width: 48, height: 48 }}
                  />
                }
                title="你好，我是 ArtCore AI"
                description="我是你的游戏美术创作助手，可协助角色、场景与风格设定。试试下面的灵感提示吧！"
                variant="borderless"
              />
              <Prompts
                items={WELCOME_PROMPTS}
                wrap
                onItemClick={(info) => {
                  const label = info.data.label
                  if (typeof label === "string") handleSend(label)
                }}
                styles={{
                  item: {
                    flex: "0 0 calc(50% - 8px)",
                    borderRadius: 12,
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto" style={{ display: "flex", flexDirection: "column" }}>
              <Bubble.List
                items={bubbleItems}
                role={roles}
                autoScroll
                style={{ flex: 1, minHeight: 0 }}
              />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="shrink-0 px-6 pb-4 pt-2" style={{ maxWidth: 820, width: "100%", margin: "0 auto" }}>
          <Sender
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSend}
            loading={isGenerating}
            onCancel={handleCancel}
            placeholder="输入消息，按 Enter 发送..."
            autoSize={{ minRows: 1, maxRows: 6 }}
          />
          <div className="text-center text-xs text-gray-400 mt-2">
            内容由 AI 生成，仅供参考
          </div>
        </div>
      </div>
    </div>
  )
}
