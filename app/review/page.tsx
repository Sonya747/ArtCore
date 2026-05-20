"use client"

import {
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    FileDoneOutlined,
    InboxOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
} from "@ant-design/icons"
import {
    App,
    Avatar,
    Badge,
    Button,
    Empty,
    Input,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Tooltip,
    Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/zh-cn"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { API } from "@/service"
import type { Auth } from "@/service/auth/typing"
import { getMeApi } from "@/service/auth"
import type { REVIEWS } from "@/service/reviews/typing"
import ReviewDetailDrawer from "./components/review-detail-drawer"

dayjs.extend(relativeTime)
dayjs.locale("zh-cn")

const { Text } = Typography

const STATUS_LABEL: Record<REVIEWS.ReviewStatus, string> = {
    pending: "待审核",
    approved: "已通过",
    rejected: "未通过",
}

const STATUS_COLOR: Record<REVIEWS.ReviewStatus, string> = {
    pending: "gold",
    approved: "green",
    rejected: "red",
}

const STATUS_ICON: Record<REVIEWS.ReviewStatus, React.ReactNode> = {
    pending: <ClockCircleOutlined />,
    approved: <CheckCircleOutlined />,
    rejected: <CloseCircleOutlined />,
}

export default function ReviewPage() {
    const { message } = App.useApp()
    const router = useRouter()
    const [me, setMe] = useState<Auth.UserInfo | null>(null)
    const [tab, setTab] = useState<REVIEWS.ReviewTab>("mine")
    const [statusFilter, setStatusFilter] = useState<
        REVIEWS.ReviewStatus | "all" | "finished"
    >("all")
    const [keyword, setKeyword] = useState<string>("")
    const [items, setItems] = useState<REVIEWS.ReviewItem[]>([])
    const [loading, setLoading] = useState(false)
    const [pendingInboxCount, setPendingInboxCount] = useState(0)
    const [summary, setSummary] = useState<REVIEWS.ReviewSummary>({
        my_todo: 0,
        pending_as_reviewer: 0,
        pending_as_submitter: 0,
        my_done_as_reviewer: 0,
        my_rejected_as_submitter: 0,
    })
    const [detailOpen, setDetailOpen] = useState(false)
    const [detail, setDetail] = useState<REVIEWS.ReviewDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)

    useEffect(() => {
        void getMeApi().then((user) => setMe(user))
    }, [])

    const loadList = useCallback(async () => {
        setLoading(true)
        try {
            const res = await API.reviews.listReviews({
                tab,
                status: statusFilter,
                keyword: keyword.trim() || undefined,
                page: 1,
                page_size: 100,
            })
            setItems(res.results)
            setPendingInboxCount(res.pending_inbox_count)
            if (res.summary) {
                setSummary(res.summary)
            }
        } catch (e) {
            if (e instanceof Error) message.error(e.message)
        } finally {
            setLoading(false)
        }
    }, [tab, statusFilter, keyword, message])

    useEffect(() => {
        void loadList()
    }, [loadList])

    useEffect(() => {
        if (tab === "mine" && statusFilter === "finished") {
            setStatusFilter("all")
        }
    }, [tab, statusFilter])

    const openDetail = async (item: REVIEWS.ReviewItem) => {
        setDetail(null)
        setDetailOpen(true)
        setDetailLoading(true)
        try {
            const res = await API.reviews.getReviewDetail(item.id)
            setDetail(res.review)
        } catch (e) {
            if (e instanceof Error) message.error(e.message)
            setDetailOpen(false)
        } finally {
            setDetailLoading(false)
        }
    }

    const columns = useMemo<ColumnsType<REVIEWS.ReviewItem>>(
        () => [
            {
                title: "缩略图",
                key: "thumbnail",
                width: 100,
                render: (_, record) =>
                    record.task.thumbnail_url ? (
                        <img
                            src={record.task.thumbnail_url}
                            alt=""
                            className="h-14 w-14 rounded-lg object-cover ring-1 ring-line-color"
                        />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-default-bg-color text-assistant-text-color">
                            <InboxOutlined />
                        </div>
                    ),
            },
            {
                title: "任务",
                key: "task",
                render: (_, record) => (
                    <div className="flex flex-col gap-1 min-w-0">
                        <Tooltip title={record.submitter_note || "（无提交备注）"}>
                            <span className="max-w-[360px] truncate text-sm font-medium text-block-title-color">
                                {record.submitter_note || "（无提交备注）"}
                            </span>
                        </Tooltip>
                        <Space size={6} wrap className="text-xs text-assistant-text-color">
                            <span className="font-mono">#{record.task.id.slice(0, 8)}</span>
                            <Tag color="blue">v{record.version}</Tag>
                        </Space>
                    </div>
                ),
            },
            {
                title: tab === "mine" ? "审核人" : "提交人",
                key: "counterparty",
                width: 180,
                render: (_, record) => {
                    const person = tab === "mine" ? record.reviewer : record.submitter
                    if (!person) return <Text type="secondary">未分配</Text>
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar size={28} className="bg-secondary-color/20 text-primary-color">
                                {person.name.slice(0, 1)}
                            </Avatar>
                            <span className="text-sm">{person.name}</span>
                        </div>
                    )
                },
            },
            {
                title: "状态",
                dataIndex: "status",
                key: "status",
                width: 120,
                render: (status: REVIEWS.ReviewStatus) => (
                    <Tag icon={STATUS_ICON[status]} color={STATUS_COLOR[status]}>
                        {STATUS_LABEL[status]}
                    </Tag>
                ),
            },
            {
                title: "提交时间",
                dataIndex: "created_at",
                key: "created_at",
                width: 150,
                render: (created_at: string) => (
                    <Tooltip title={dayjs(created_at).format("YYYY-MM-DD HH:mm:ss")}>
                        <Space size={6} className="text-sm text-assistant-text-color">
                            <CalendarOutlined />
                            {dayjs(created_at).fromNow()}
                        </Space>
                    </Tooltip>
                ),
            },
            {
                title: "操作",
                key: "actions",
                width: 160,
                render: (_, record) => (
                    <Space size={0} separator={<Text type="secondary">|</Text>}>
                        <a onClick={() => openDetail(record)}>查看详情</a>
                        {tab === "mine" && record.status === "rejected" && (
                            <a onClick={() => router.push(`/review/new?resubmit=${record.id}`)}>重新提交</a>
                        )}
                    </Space>
                ),
            },
        ],
        [tab],
    )

    const tabItems = [
        {
            key: "mine",
            label: "我的提交",
        },
        {
            key: "inbox",
            label: (
                <Space size={6}>
                    <span>待我审批</span>
                    {pendingInboxCount > 0 && (
                        <Badge count={pendingInboxCount} size="small" />
                    )}
                </Space>
            ),
        },
    ]

    const statusSelectOptions = useMemo(() => {
        if (tab === "inbox") {
            return [
                { value: "all" as const, label: "全部状态" },
                { value: "pending" as const, label: STATUS_LABEL.pending },
                {
                    value: "finished" as const,
                    label: "已办结（通过或驳回）",
                },
                { value: "approved" as const, label: STATUS_LABEL.approved },
                { value: "rejected" as const, label: STATUS_LABEL.rejected },
            ]
        }
        return [
            { value: "all" as const, label: "全部状态" },
            { value: "pending" as const, label: STATUS_LABEL.pending },
            { value: "approved" as const, label: STATUS_LABEL.approved },
            { value: "rejected" as const, label: STATUS_LABEL.rejected },
        ]
    }, [tab])

    const isAdminReviewer = detail && me && detail.reviewer?.id === me.id
    const canReviewNow = isAdminReviewer && detail.status === "pending"
    const canResubmit = detail && me && detail.submitter.id === me.id && detail.status === "rejected"

    return (
        <div className="flex h-full max-h-screen flex-col bg-default-bg-color">
            <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 py-4 my-4">
                <Space size={16} align="center">
                    <span className="text-xl font-medium text-block-title-color">审批中心</span>
                </Space>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push("/review/new")}
                >
                    提交审批
                </Button>
            </div>

            <div className="flex flex-col gap-4 px-6 pb-6 flex-1 overflow-hidden">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                        type="button"
                        onClick={() => {
                            if (summary.pending_as_reviewer > 0) {
                                setTab("inbox")
                                setStatusFilter("pending")
                            } else if (summary.pending_as_submitter > 0) {
                                setTab("mine")
                                setStatusFilter("pending")
                            }
                        }}
                        className="group flex flex-col gap-2 rounded-2xl border border-line-color bg-card-bg-color px-5 py-4 text-left shadow-sm transition-colors hover:border-primary-color/30 hover:bg-default-bg-color"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-assistant-text-color">
                                我的待办
                            </span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff7e6] text-lg text-[#d48806] dark:bg-[#3d3000] dark:text-[#ffc53d]">
                                <ClockCircleOutlined />
                            </span>
                        </div>
                        <span className="text-3xl font-semibold tabular-nums text-block-title-color">
                            {summary.my_todo}
                        </span>
                        <span className="text-xs text-assistant-text-color">
                            待我审批 {summary.pending_as_reviewer} · 我提交待审{" "}
                            {summary.pending_as_submitter}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setTab("inbox")
                            setStatusFilter("finished")
                        }}
                        className="group flex flex-col gap-2 rounded-2xl border border-line-color bg-card-bg-color px-5 py-4 text-left shadow-sm transition-colors hover:border-primary-color/30 hover:bg-default-bg-color"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-assistant-text-color">
                                我的已办
                            </span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6ffed] text-lg text-[#389e0d] dark:bg-[#162312] dark:text-[#73d13d]">
                                <FileDoneOutlined />
                            </span>
                        </div>
                        <span className="text-3xl font-semibold tabular-nums text-block-title-color">
                            {summary.my_done_as_reviewer}
                        </span>
                        <span className="text-xs text-assistant-text-color">
                            我作为审核人已办结（通过或驳回）
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setTab("mine")
                            setStatusFilter("rejected")
                        }}
                        className="group flex flex-col gap-2 rounded-2xl border border-line-color bg-card-bg-color px-5 py-4 text-left shadow-sm transition-colors hover:border-primary-color/30 hover:bg-default-bg-color"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-assistant-text-color">
                                未通过
                            </span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff2f0] text-lg text-[#cf1322] dark:bg-[#2a1215] dark:text-[#ff7875]">
                                <CloseCircleOutlined />
                            </span>
                        </div>
                        <span className="text-3xl font-semibold tabular-nums text-block-title-color">
                            {summary.my_rejected_as_submitter}
                        </span>
                        <span className="text-xs text-assistant-text-color">
                            我作为提交人被驳回，可重新发起
                        </span>
                    </button>
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <Tabs
                        activeKey={tab}
                        onChange={(k) => {
                            setTab(k as REVIEWS.ReviewTab)
                            setStatusFilter("all")
                        }}
                        items={tabItems}
                        className="mb-0"
                    />
                    <Space size={8} wrap>
                        <Select<REVIEWS.ReviewStatus | "all" | "finished">
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: 200 }}
                            options={statusSelectOptions}
                        />
                        <Input
                            allowClear
                            prefix={<SearchOutlined className="text-assistant-text-color" />}
                            placeholder="搜索任务名称或提交人"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onPressEnter={() => void loadList()}
                            style={{ width: 260 }}
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => void loadList()}
                        />
                    </Space>
                </div>

                <div className="flex-1 overflow-auto rounded-2xl bg-card-bg-color scrollbar-thin scrollbar-auto-hide scrollbar-stable">
                    <Table<REVIEWS.ReviewItem>
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={items}
                        pagination={{
                            pageSize: 10,
                            total: items.length,
                            showSizeChanger: false,
                        }}
                        size="middle"
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        tab === "mine"
                                            ? "暂无提交记录，点击右上角「提交审批」创建第一条"
                                            : "暂无需要你审批的内容"
                                    }
                                />
                            ),
                        }}
                    />
                </div>
            </div>

            <ReviewDetailDrawer
                open={detailOpen}
                loading={detailLoading}
                detail={detail}
                canReviewNow={!!canReviewNow}
                canResubmit={!!canResubmit}
                statusLabel={STATUS_LABEL}
                statusColor={STATUS_COLOR}
                statusIcon={STATUS_ICON}
                onClose={() => {
                    setDetailOpen(false)
                    setDetail(null)
                }}
                onCopyPrompt={(text) => {
                    void navigator.clipboard?.writeText(text)
                    message.success("Prompt 已复制")
                }}
                onAct={async (action, reviewerNote) => {
                    if (!detail) return
                    try {
                        const res = await API.reviews.actOnReview({
                            id: detail.id,
                            action,
                            reviewer_note: reviewerNote,
                        })
                        message.success(res.message)
                        setDetailOpen(false)
                        setDetail(null)
                        void loadList()
                    } catch (e) {
                        if (e instanceof Error) message.error(e.message)
                    }
                }}
                onResubmit={() => {
                    if (!detail) return
                    setDetailOpen(false)
                    router.push(`/review/new?resubmit=${detail.id}`)
                }}
            />

        </div>
    )
}
