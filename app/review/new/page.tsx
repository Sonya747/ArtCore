"use client"

import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    InboxOutlined,
    ReloadOutlined,
    SendOutlined,
} from "@ant-design/icons"
import {
    App,
    Button,
    Empty,
    Form,
    Input,
    Select,
    Space,
    Spin,
    Typography,
} from "antd"
import dayjs from "dayjs"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { API } from "@/service"
import type { REVIEWS } from "@/service/reviews/typing"

function truncate(text: string, max = 42) {
    if (!text) return ""
    return text.length > max ? `${text.slice(0, max)}…` : text
}

export default function NewReviewPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const resubmitId = searchParams.get("resubmit")
    const { message } = App.useApp()

    const [form] = Form.useForm<{
        reviewer_id: string
        submitter_note?: string
    }>()

    const [pageLoading, setPageLoading] = useState(true)
    const [reviewableTasks, setReviewableTasks] = useState<REVIEWS.ReviewableTask[]>([])
    const [reviewers, setReviewers] = useState<REVIEWS.ReviewUser[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [submitLoading, setSubmitLoading] = useState(false)
    const [resubmitParent, setResubmitParent] = useState<REVIEWS.ReviewDetail | null>(null)

    const selectedTasks = useMemo(
        () => reviewableTasks.filter((t) => selectedIds.has(t.id)),
        [reviewableTasks, selectedIds],
    )

    const loadData = useCallback(async () => {
        setPageLoading(true)
        try {
            const [tasks, admins] = await Promise.all([
                API.reviews.listReviewableTasks(),
                API.reviews.listReviewers(),
            ])
            setReviewableTasks(tasks.results)
            setReviewers(admins.results)

            if (resubmitId) {
                const res = await API.reviews.getReviewDetail(resubmitId)
                const detail = res.review
                setResubmitParent(detail)
                setSelectedIds(new Set([detail.task.id]))
                form.setFieldsValue({
                    reviewer_id: detail.reviewer?.id ?? admins.results[0]?.id,
                    submitter_note: "已根据意见调整提示词，重新生成。",
                })
            } else if (admins.results[0]) {
                form.setFieldsValue({ reviewer_id: admins.results[0].id })
            }
        } catch (e) {
            if (e instanceof Error) message.error(e.message)
        } finally {
            setPageLoading(false)
        }
    }, [resubmitId, form, message])

    useEffect(() => {
        void loadData()
    }, [loadData])

    const toggleTask = (id: string) => {
        if (resubmitParent) return
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleSubmit = async () => {
        if (selectedIds.size === 0) {
            message.warning("请至少选择一个任务")
            return
        }
        try {
            const values = await form.validateFields()
            setSubmitLoading(true)
            const taskIds = Array.from(selectedIds)
            let lastMsg = ""
            for (const taskId of taskIds) {
                const res = await API.reviews.createReview({
                    task_id: taskId,
                    reviewer_id: values.reviewer_id,
                    submitter_note: values.submitter_note,
                    parent_request_id: resubmitParent?.id,
                })
                lastMsg = res.message
            }
            message.success(taskIds.length > 1 ? `已成功提交 ${taskIds.length} 条审批` : lastMsg)
            router.push("/review")
        } catch (e) {
            if (e instanceof Error) message.error(e.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    if (pageLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-default-bg-color">
                <Spin size="large" />
            </div>
        )
    }

    return (
        <div className="flex h-full max-h-screen flex-col bg-default-bg-color">
            {/* 顶栏 */}
            <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 py-4 my-4">
                <Space size={12} align="center">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.push("/review")}
                    />
                    <span className="text-xl font-medium text-block-title-color">
                        {resubmitParent ? "重新发起审批" : "提交新审批"}
                    </span>
                </Space>
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={submitLoading}
                    onClick={() => void handleSubmit()}
                >
                    提交审批{selectedIds.size > 0 ? `（${selectedIds.size}）` : ""}
                </Button>
            </div>

            {/* 主体 */}
            <div className="flex flex-1 gap-6 overflow-hidden px-6 pb-6">
                {/* 左侧：任务选择卡片网格 */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-card-bg-color">
                    <div className="flex shrink-0 items-center justify-between border-b border-line-color px-5 py-3">
                        <span className="text-sm font-medium text-block-title-color">
                            选择任务
                            {selectedIds.size > 0 && (
                                <span className="ml-2 text-primary-color">
                                    已选 {selectedIds.size} 项
                                </span>
                            )}
                        </span>
                        {!resubmitParent && selectedIds.size > 0 && (
                            <Button
                                type="link"
                                size="small"
                                onClick={() => setSelectedIds(new Set())}
                            >
                                清空选择
                            </Button>
                        )}
                    </div>

                    {reviewableTasks.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center">
                            <Empty description="暂无可提交的任务" />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-auto-hide scrollbar-stable">
                            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                                {reviewableTasks.map((task) => {
                                    const checked = selectedIds.has(task.id)
                                    const disabled = !!resubmitParent && task.id !== resubmitParent.task.id
                                    return (
                                        <div
                                            key={task.id}
                                            className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                                                disabled
                                                    ? "pointer-events-none opacity-40 border-line-color"
                                                    : checked
                                                        ? "cursor-pointer border-primary-color shadow-md"
                                                        : "cursor-pointer border-line-color hover:border-primary-color/40"
                                            }`}
                                            onClick={() => toggleTask(task.id)}
                                        >
                                            <div className="relative">
                                                {task.image_url || task.thumbnail_url ? (
                                                    <img
                                                        src={task.image_url || task.thumbnail_url || ""}
                                                        alt=""
                                                        className="h-[180px] w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-[180px] items-center justify-center bg-default-bg-color text-assistant-text-color">
                                                        <InboxOutlined className="text-2xl" />
                                                    </div>
                                                )}
                                                <div
                                                    className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                                                        checked
                                                            ? "border-primary-color bg-primary-color text-white"
                                                            : "border-white/80 bg-black/20 text-transparent group-hover:border-white"
                                                    }`}
                                                >
                                                    <CheckCircleOutlined className="text-sm" />
                                                </div>
                                            </div>
                                            <div className="p-2.5">
                                                <Typography.Paragraph
                                                    className="mb-1! text-sm text-block-title-color"
                                                    ellipsis={{ rows: 1, tooltip: task.raw_prompt }}
                                                >
                                                    {task.raw_prompt}
                                                </Typography.Paragraph>
                                                <Typography.Text type="secondary" className="text-xs">
                                                    {dayjs(task.created_at).format("YYYY-MM-DD HH:mm")}
                                                </Typography.Text>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* 右侧：表单区域 */}
                <div className="w-[340px] shrink-0 overflow-y-auto rounded-2xl bg-card-bg-color p-5 scrollbar-thin scrollbar-auto-hide scrollbar-stable">
                    {resubmitParent && (
                        <div className="mb-5 rounded-xl border border-line-color bg-default-bg-color p-3 text-xs">
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

                    {/* 已选任务预览 */}
                    {selectedTasks.length > 0 && (
                        <div className="mb-5">
                            <div className="mb-2 text-sm font-medium text-block-title-color">
                                已选任务（{selectedTasks.length}）
                            </div>
                            <div className="flex flex-col gap-2">
                                {selectedTasks.map((t) => (
                                    <div
                                        key={t.id}
                                        className="flex items-center gap-2.5 rounded-lg border border-line-color bg-default-bg-color p-2"
                                    >
                                        {t.image_url || t.thumbnail_url ? (
                                            <img
                                                src={t.image_url || t.thumbnail_url || ""}
                                                alt=""
                                                className="h-10 w-10 shrink-0 rounded-md object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card-bg-color text-xs text-assistant-text-color">
                                                <InboxOutlined />
                                            </div>
                                        )}
                                        <span className="min-w-0 flex-1 truncate text-xs text-block-title-color">
                                            {truncate(t.raw_prompt, 24)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Form form={form} layout="vertical" requiredMark={false}>
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
                                rows={4}
                                placeholder="可说明本次提交的背景，如：用于首页 banner、已根据意见调整 xxx"
                                maxLength={500}
                                showCount
                            />
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </div>
    )
}
