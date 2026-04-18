"use client"

import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    CopyOutlined,
    ReloadOutlined,
    SendOutlined,
} from "@ant-design/icons"
import {
    App,
    Button,
    Drawer,
    Empty,
    Input,
    Modal,
    Space,
    Tag,
    Timeline,
    Typography,
} from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import type { REVIEWS } from "@/service/reviews/typing"

const { Text, Paragraph } = Typography

interface ReviewDetailDrawerProps {
    open: boolean
    loading: boolean
    detail: REVIEWS.ReviewDetail | null
    canReviewNow: boolean
    canResubmit: boolean
    statusLabel: Record<REVIEWS.ReviewStatus, string>
    statusColor: Record<REVIEWS.ReviewStatus, string>
    statusIcon: Record<REVIEWS.ReviewStatus, React.ReactNode>
    onClose: () => void
    onCopyPrompt: (text: string) => void
    onAct: (action: "approve" | "reject", note: string) => Promise<void>
    onResubmit: () => void
}

export default function ReviewDetailDrawer({
    open,
    loading,
    detail,
    canReviewNow,
    canResubmit,
    statusLabel,
    statusColor,
    statusIcon,
    onClose,
    onCopyPrompt,
    onAct,
    onResubmit,
}: ReviewDetailDrawerProps) {
    const { modal } = App.useApp()
    const [reviewerNote, setReviewerNote] = useState("")
    const [acting, setActing] = useState(false)

    useEffect(() => {
        if (open) setReviewerNote("")
    }, [open, detail?.id])

    const handleApprove = async () => {
        setActing(true)
        try {
            await onAct("approve", reviewerNote)
        } finally {
            setActing(false)
        }
    }

    const handleReject = () => {
        const note = reviewerNote.trim()
        if (!note) {
            Modal.warning({
                title: "请填写批注",
                content: "驳回必须说明具体修改意见（例如：光影太亮、人物手指崩了）",
            })
            return
        }
        modal.confirm({
            title: "确认驳回本次审批？",
            content: "驳回后提交人可基于此批注重新发起审批。",
            okText: "确认驳回",
            okButtonProps: { danger: true },
            onOk: async () => {
                setActing(true)
                try {
                    await onAct("reject", note)
                } finally {
                    setActing(false)
                }
            },
        })
    }

    const promptForCopy = detail?.task.final_prompt || detail?.task.raw_prompt || ""

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={820}
            destroyOnHidden
            title={
                detail ? (
                    <Space>
                        <span>审批详情</span>
                        <Tag icon={statusIcon[detail.status]} color={statusColor[detail.status]}>
                            {statusLabel[detail.status]}
                        </Tag>
                        {detail.version > 1 && <Tag color="blue">v{detail.version}</Tag>}
                    </Space>
                ) : (
                    "审批详情"
                )
            }
        >
            {loading || !detail ? (
                <div className="flex h-full items-center justify-center">
                    <Text type="secondary">{loading ? "加载中…" : "无数据"}</Text>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="flex flex-col gap-4 lg:col-span-3">
                        <div className="rounded-2xl bg-default-bg-color p-3">
                            {detail.task_images.length ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {detail.task_images.map((img) => (
                                        <img
                                            key={img.id}
                                            src={img.image_url}
                                            alt=""
                                            className="w-full rounded-xl object-cover"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Empty description="暂无生成图片" />
                            )}
                        </div>

                        <div className="flex flex-col gap-3 rounded-2xl border border-line-color bg-card-bg-color p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-block-title-color">
                                    Prompt 信息
                                </span>
                                <Button
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() => onCopyPrompt(promptForCopy)}
                                >
                                    一键复制 Prompt
                                </Button>
                            </div>
                            <PromptRow label="原始提示词" value={detail.task.raw_prompt} />
                            <PromptRow label="最终提示词" value={detail.task.final_prompt} />
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <InfoCell label="模型" value={detail.task.model_name ?? "-"} />
                                <InfoCell label="图片尺寸" value={detail.task.image_size ?? "-"} />
                                <InfoCell
                                    label="任务 ID"
                                    value={<span className="font-mono">{detail.task.id}</span>}
                                />
                                <InfoCell
                                    label="请求参数"
                                    value={
                                        detail.task.request_params ? (
                                            <pre className="whitespace-pre-wrap break-all rounded-md bg-default-bg-color p-2 text-[11px] leading-snug">
                                                {JSON.stringify(detail.task.request_params, null, 2)}
                                            </pre>
                                        ) : (
                                            "-"
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 lg:col-span-2">
                        <div className="rounded-2xl border border-line-color bg-card-bg-color p-4">
                            <div className="mb-3 text-sm font-medium text-block-title-color">
                                审批历史
                            </div>
                            <Timeline
                                items={detail.history.map((entry) => {
                                    const isReview = entry.type === "review"
                                    const dotColor =
                                        entry.status === "approved"
                                            ? "green"
                                            : entry.status === "rejected"
                                              ? "red"
                                              : isReview
                                                ? "blue"
                                                : "gray"
                                    return {
                                        color: dotColor,
                                        dot: isReview
                                            ? entry.status === "approved"
                                                ? <CheckCircleOutlined />
                                                : entry.status === "rejected"
                                                  ? <CloseCircleOutlined />
                                                  : <ClockCircleOutlined />
                                            : <SendOutlined />,
                                        children: (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-block-title-color">
                                                        {isReview ? "审核意见" : "提交申请"}
                                                    </span>
                                                    <Tag>v{entry.version}</Tag>
                                                    {entry.status && (
                                                        <Tag color={statusColor[entry.status]}>
                                                            {statusLabel[entry.status]}
                                                        </Tag>
                                                    )}
                                                </div>
                                                <div className="text-xs text-assistant-text-color">
                                                    {entry.actor.name} · {dayjs(entry.at).format("YYYY-MM-DD HH:mm")}
                                                </div>
                                                {entry.note && (
                                                    <div
                                                        className={
                                                            entry.status === "rejected"
                                                                ? "rounded-lg bg-[#fff1f0] p-2 text-xs text-[#cf1322]"
                                                                : "rounded-lg bg-default-bg-color p-2 text-xs"
                                                        }
                                                    >
                                                        {entry.note}
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    }
                                })}
                            />
                        </div>

                        {canReviewNow && (
                            <div className="flex flex-col gap-3 rounded-2xl border border-line-color bg-card-bg-color p-4">
                                <div className="text-sm font-medium text-block-title-color">
                                    批注意见
                                </div>
                                <Input.TextArea
                                    rows={4}
                                    value={reviewerNote}
                                    onChange={(e) => setReviewerNote(e.target.value)}
                                    placeholder="驳回必填：请具体说明修改意见，例如「光影太亮，人物手指崩了」"
                                    maxLength={500}
                                    showCount
                                />
                                <Space className="justify-end">
                                    <Button
                                        danger
                                        icon={<CloseCircleOutlined />}
                                        onClick={handleReject}
                                        loading={acting}
                                    >
                                        驳回
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        onClick={() => void handleApprove()}
                                        loading={acting}
                                    >
                                        通过
                                    </Button>
                                </Space>
                            </div>
                        )}

                        {canResubmit && (
                            <div className="flex flex-col gap-3 rounded-2xl border border-[#ffccc7] bg-[#fff2f0] p-4">
                                <div className="text-sm font-medium text-[#cf1322]">
                                    管理员批注
                                </div>
                                <Paragraph
                                    className="mb-0 whitespace-pre-wrap text-sm text-[#434343]!"
                                >
                                    {detail.reviewer_note || "（未填写）"}
                                </Paragraph>
                                <Space className="justify-end">
                                    <Button
                                        type="primary"
                                        icon={<ReloadOutlined />}
                                        onClick={onResubmit}
                                    >
                                        以此参数重新发起审批
                                    </Button>
                                </Space>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Drawer>
    )
}

function PromptRow({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="text-xs text-assistant-text-color">{label}</div>
            <div className="whitespace-pre-wrap wrap-break-word text-sm text-block-title-color">
                {value || <Text type="secondary">-</Text>}
            </div>
        </div>
    )
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-assistant-text-color">{label}</span>
            <div className="text-block-title-color">{value}</div>
        </div>
    )
}
