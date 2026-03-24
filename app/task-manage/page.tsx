"use client"

import { CalendarOutlined } from "@ant-design/icons"
import { App, Space, Table, Tag, Tooltip, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useCallback, useEffect, useState } from "react"
import { API } from "@/service"
import type { TASKS } from "@/service/tasks/typing"
import { MOCK_USER_ID } from "@/service/tasks"

const { Link: TextLink, Text } = Typography

const STATUS_LABEL: Record<TASKS.GenerationTaskStatus, string> = {
    pending: "待执行",
    running: "运行中",
    success: "成功",
    failed: "失败",
}

const STATUS_COLOR: Record<TASKS.GenerationTaskStatus, string> = {
    pending: "default",
    running: "blue",
    success: "green",
    failed: "red",
}

export default function TaskManagePage() {
    const { message, modal } = App.useApp()
    const [loading, setLoading] = useState(false)
    const [tasks, setTasks] = useState<TASKS.GenerationTask[]>([])

    const loadTasks = useCallback(async () => {
        setLoading(true)
        try {
            const res = await API.tasks.listGenerationTasks({
                user_id: MOCK_USER_ID,
                page: 1,
                page_size: 100,
            })
            setTasks(res.results)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadTasks()
    }, [loadTasks])

    const handleReuse = (_record: TASKS.GenerationTask) => {
        // 复用操作暂未实现（按需求保持空函数）
    }

    const handleDelete = (record: TASKS.GenerationTask) => {
        modal.confirm({
            title: "删除任务",
            content: `确定删除该任务（${record.id}）吗？`,
            okText: "删除",
            okButtonProps: { danger: true },
            onOk: async () => {
                await API.tasks.deleteGenerationTasks({ ids: [record.id] })
                message.success("任务已删除")
                void loadTasks()
            },
        })
    }

    const columns: ColumnsType<TASKS.GenerationTask> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 220,
            render: (id: string) => (
                <span className="font-mono text-xs max-w-[200px] truncate inline-block" title={id}>
                    {id}
                </span>
            ),
        },
        {
            title: "用户ID",
            dataIndex: "user_id",
            key: "user_id",
            width: 160,
            render: (user_id: string) => (
                <span className="max-w-[140px] truncate inline-block" title={user_id}>
                    {user_id}
                </span>
            ),
        },
        {
            title: "提示词",
            key: "prompt",
            width: 280,
            render: (_, record) => {
                const promptValue = record.input_params?.prompt
                const prompt = typeof promptValue === "string" ? promptValue : "-"
                return (
                    <Tooltip title={prompt}>
                        <span className="max-w-[260px] truncate inline-block" title={prompt}>
                            {prompt}
                        </span>
                    </Tooltip>
                )
            },
        },
        {
            title: "输入参数",
            dataIndex: "input_params",
            key: "input_params",
            width: 320,
            render: (input_params: TASKS.GenerationTask["input_params"]) => {
                const { prompt: _prompt, ...rest } = input_params
                const preview = Object.keys(rest).length ? JSON.stringify(rest) : "-"
                return (
                    <Tooltip title={<pre className="m-0 whitespace-pre-wrap">{preview}</pre>}>
                        <span className="max-w-[300px] truncate inline-block font-mono text-xs" title={preview}>
                            {preview}
                        </span>
                    </Tooltip>
                )
            },
        },
        {
            title: "模型",
            dataIndex: "model_label",
            key: "model_label",
            width: 120,
            render: (model_label: string) => (
                <span className="max-w-[110px] truncate inline-block" title={model_label}>
                    {model_label}
                </span>
            ),
        },
        {
            title: "工作流",
            dataIndex: "workflow_name",
            key: "workflow_name",
            width: 240,
            render: (workflow_name: string) => (
                <span className="max-w-[220px] truncate inline-block" title={workflow_name}>
                    {workflow_name}
                </span>
            ),
        },
        {
            title: "状态",
            dataIndex: "status",
            key: "status",
            width: 110,
            render: (status: TASKS.GenerationTaskStatus) => (
                <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
            ),
        },
        {
            title: "错误信息",
            dataIndex: "error_message",
            key: "error_message",
            width: 260,
            render: (error_message?: string | null) =>
                error_message ? (
                    <Tooltip title={error_message}>
                        <span className="max-w-[240px] truncate inline-block" title={error_message}>
                            {error_message}
                        </span>
                    </Tooltip>
                ) : (
                    <Text type="secondary">-</Text>
                ),
        },
        {
            title: "创建时间",
            dataIndex: "created_at",
            key: "created_at",
            width: 170,
            render: (created_at: string) => (
                <Space size={8}>
                    <CalendarOutlined className="text-assistant-text-color" />
                    <span>{dayjs(created_at).format("MM/DD/YYYY HH:mm:ss")}</span>
                </Space>
            ),
        },
        {
            title: "开始时间",
            dataIndex: "started_at",
            key: "started_at",
            width: 170,
            render: (started_at?: string | null) =>
                started_at ? dayjs(started_at).format("MM/DD/YYYY HH:mm:ss") : <Text type="secondary">-</Text>,
        },
        {
            title: "完成时间",
            dataIndex: "finished_at",
            key: "finished_at",
            width: 170,
            render: (finished_at?: string | null) =>
                finished_at ? dayjs(finished_at).format("MM/DD/YYYY HH:mm:ss") : <Text type="secondary">-</Text>,
        },
        {
            title: "操作",
            key: "actions",
            width: 160,
            render: (_, record) => (
                <Space size={0} separator={<Text type="secondary">|</Text>}>
                    <TextLink className="text-primary-color!" onClick={() => handleDelete(record)}>
                        删除
                    </TextLink>
                    <TextLink onClick={() => handleReuse(record)}>复用</TextLink>
                </Space>
            ),
        },
    ]

    return (
        <div className="flex h-full max-h-screen flex-col bg-default-bg-color">
            <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 py-4 my-4">
                <Space size={16} align="center">
                    <span className="text-xl font-medium text-block-title-color">任务管理</span>
                </Space>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-auto px-6 pb-6 scrollbar-thin scrollbar-auto-hide scrollbar-stable">
                <Table<TASKS.GenerationTask>
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={tasks}
                    size="middle"
                    scroll={{ x: 2100 }}
                    pagination={{
                        pageSize: 10,
                        total: tasks.length,
                        current: 1,
                        onChange: (page) => {
                            console.log(page)
                        },
                    }}
                />
            </div>
        </div>
    )
}
