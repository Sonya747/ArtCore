"use client"

import {
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    CopyOutlined,
    FileDoneOutlined,
    InboxOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    SendOutlined,
} from "@ant-design/icons"
import {
    App,
    Avatar,
    Badge,
    Button,
    Drawer,
    Empty,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Timeline,
    Tooltip,
    Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/zh-cn"
import { useCallback, useEffect, useMemo, useState } from "react"
import { API } from "@/service"
import type { Auth } from "@/service/auth/typing"
import { getMeApi } from "@/service/auth"
import type { REVIEWS } from "@/service/reviews/typing"

dayjs.extend(relativeTime)
dayjs.locale("zh-cn")

const { Text, Paragraph } = Typography

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

function truncate(text: string, max = 42) {
    if (!text) return ""
    return text.length > max ? `${text.slice(0, max)}…` : text
}

export default function ReviewPage() {
    const { message } = App.useApp()
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
    const [submitOpen, setSubmitOpen] = useState(false)
    const [submitForm] = Form.useForm<{
        task_id: string
        reviewer_id: string
        submitter_note?: string
    }>()
    const [reviewableTasks, setReviewableTasks] = useState<REVIEWS.ReviewableTask[]>([])
    const [reviewers, setReviewers] = useState<REVIEWS.ReviewUser[]>([])
    const [submitLoading, setSubmitLoading] = useState(false)
    const [resubmitParent, setResubmitParent] = useState<REVIEWS.ReviewItem | null>(null)

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

    const openSubmitModal = async (parent?: REVIEWS.ReviewItem) => {
        setResubmitParent(parent ?? null)
        submitForm.resetFields()
        try {
            const [tasks, admins] = await Promise.all([
                API.reviews.listReviewableTasks(),
                API.reviews.listReviewers(),
            ])
            setReviewableTasks(tasks.results)
            setReviewers(admins.results)

            if (parent) {
                submitForm.setFieldsValue({
                    task_id: parent.task.id,
                    reviewer_id: parent.reviewer?.id ?? admins.results[0]?.id,
                    submitter_note: "已根据意见调整提示词，重新生成。",
                })
            } else if (admins.results[0]) {
                submitForm.setFieldsValue({ reviewer_id: admins.results[0].id })
            }

            setSubmitOpen(true)
        } catch (e) {
            if (e instanceof Error) message.error(e.message)
        }
    }

    const handleSubmit = async () => {
        try {
            const values = await submitForm.validateFields()
            setSubmitLoading(true)
            const res = await API.reviews.createReview({
                task_id: values.task_id,
                reviewer_id: values.reviewer_id,
                submitter_note: values.submitter_note,
                parent_request_id: resubmitParent?.id,
            })
            message.success(res.message)
            setSubmitOpen(false)
            setResubmitParent(null)
            setTab("mine")
            void loadList()
        } catch (e) {
            if (e instanceof Error) message.error(e.message)
        } finally {
            setSubmitLoading(false)
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
                        <Tooltip title={record.task.raw_prompt}>
                            <span className="max-w-[360px] truncate text-sm font-medium text-block-title-color">
                                {record.task.raw_prompt}
                            </span>
                        </Tooltip>
                        <Space size={6} wrap className="text-xs text-assistant-text-color">
                            <span className="font-mono">#{record.task.id.slice(0, 8)}</span>
                            {record.version > 1 && <Tag color="blue">v{record.version}</Tag>}
                            {record.task.model_name && <Tag>{record.task.model_name}</Tag>}
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
                            <a onClick={() => openSubmitModal(record)}>重新提交</a>
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
                    onClick={() => void openSubmitModal()}
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
                    const item: REVIEWS.ReviewItem = {
                        id: detail.id,
                        task: detail.task,
                        submitter: detail.submitter,
                        reviewer: detail.reviewer,
                        status: detail.status,
                        submitter_note: detail.submitter_note,
                        reviewer_note: detail.reviewer_note,
                        parent_request_id: detail.parent_request_id,
                        version: detail.version,
                        created_at: detail.created_at,
                        reviewed_at: detail.reviewed_at,
                    }
                    setDetailOpen(false)
                    void openSubmitModal(item)
                }}
            />

            {/* 提交 / 重新提交 弹窗 */}
            <Modal
                title={
                    <Space>
                        <SendOutlined className="text-primary-color" />
                        <span>{resubmitParent ? "重新发起审批" : "提交新审批"}</span>
                    </Space>
                }
                open={submitOpen}
                onOk={() => void handleSubmit()}
                confirmLoading={submitLoading}
                okText="提交"
                onCancel={() => {
                    setSubmitOpen(false)
                    setResubmitParent(null)
                }}
                destroyOnHidden
                width={560}
            >
                {resubmitParent && (
                    <div className="mb-4 rounded-xl border border-line-color bg-default-bg-color p-3 text-xs">
                        <div className="mb-1 flex items-center gap-2 text-assistant-text-color">
                            <ReloadOutlined />
                            基于已驳回申请重新发起 (v{resubmitParent.version} → v{resubmitParent.version + 1})
                        </div>
                        {resubmitParent.reviewer_note && (
                            <div className="text-[#e94560]">
                                管理员批注：{resubmitParent.reviewer_note}
                            </div>
                        )}
                    </div>
                )}

                <Form form={submitForm} layout="vertical" requiredMark={false}>
                    <Form.Item
                        name="task_id"
                        label="选择已生成的任务"
                        rules={[{ required: true, message: "请选择任务" }]}
                    >
                        <Select
                            disabled={!!resubmitParent}
                            showSearch
                            optionFilterProp="label"
                            placeholder={reviewableTasks.length ? "选择一条已成功生成的任务" : "暂无可提交的任务"}
                            options={reviewableTasks.map((t) => ({
                                value: t.id,
                                label: `#${t.id.slice(0, 8)} · ${truncate(t.raw_prompt, 32)}`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="reviewer_id"
                        label="审核人"
                        rules={[{ required: true, message: "请选择审核人" }]}
                    >
                        <Select
                            placeholder={reviewers.length ? "选择一位管理员" : "当前没有可用的管理员"}
                            options={reviewers.map((u) => ({
                                value: u.id,
                                label: `${u.name}（${u.username}）`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item name="submitter_note" label="提交备注（可选）">
                        <Input.TextArea
                            rows={3}
                            placeholder="可说明本次提交的背景，如：用于首页 banner、已根据意见调整 xxx"
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

// -----------------------------------------------------------------------------
// Detail drawer
// -----------------------------------------------------------------------------

interface ReviewDetailDrawerProps {
    open: boolean
    loading: boolean
    detail: REVIEWS.ReviewDetail | null
    canReviewNow: boolean
    canResubmit: boolean
    onClose: () => void
    onCopyPrompt: (text: string) => void
    onAct: (action: "approve" | "reject", note: string) => Promise<void>
    onResubmit: () => void
}

function ReviewDetailDrawer({
    open,
    loading,
    detail,
    canReviewNow,
    canResubmit,
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
                        <Tag icon={STATUS_ICON[detail.status]} color={STATUS_COLOR[detail.status]}>
                            {STATUS_LABEL[detail.status]}
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
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* 左侧：图片 + Prompt 信息 */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
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

                        <div className="rounded-2xl border border-line-color bg-card-bg-color p-4 flex flex-col gap-3">
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
                                        detail.task.request_params
                                            ? (
                                                <pre className="whitespace-pre-wrap break-all rounded-md bg-default-bg-color p-2 text-[11px] leading-snug">
                                                    {JSON.stringify(detail.task.request_params, null, 2)}
                                                </pre>
                                            )
                                            : "-"
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* 右侧：审批记录 + 操作 */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
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
                                                        <Tag color={STATUS_COLOR[entry.status]}>
                                                            {STATUS_LABEL[entry.status]}
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
                            <div className="rounded-2xl border border-line-color bg-card-bg-color p-4 flex flex-col gap-3">
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
                            <div className="rounded-2xl border border-[#ffccc7] bg-[#fff2f0] p-4 flex flex-col gap-3">
                                <div className="text-sm font-medium text-[#cf1322]">
                                    管理员批注
                                </div>
                                <Paragraph
                                    className="mb-0 text-sm text-[#434343]! whitespace-pre-wrap"
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
            <div className="text-sm text-block-title-color whitespace-pre-wrap break-words">
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
