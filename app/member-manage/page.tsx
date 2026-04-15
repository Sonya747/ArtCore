"use client"

import {
    CalendarOutlined,
    CrownOutlined,
    DeleteOutlined,
    EditOutlined,
    LockOutlined,
    PlusOutlined,
    SmileOutlined,
    TeamOutlined,
    UserOutlined,
} from "@ant-design/icons"
import {
    App,
    Avatar,
    Button,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useCallback, useEffect, useState } from "react"
import { API } from "@/service"
import type { MEMBER } from "@/service/member/typing"

const ROLE_LABEL: Record<MEMBER.MemberRole, string> = {
    admin: "管理员",
    member: "普通成员",
}

const ROLE_CONFIG: Record<MEMBER.MemberRole, { color: string; icon: React.ReactNode }> = {
    admin: { color: "purple", icon: <CrownOutlined /> },
    member: { color: "default", icon: <UserOutlined /> },
}

export default function MemberManagePage() {
    const { message, modal } = App.useApp()
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState<MEMBER.WorkspaceMember[]>([])
    const [roleModalOpen, setRoleModalOpen] = useState(false)
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [addLoading, setAddLoading] = useState(false)
    const [editingMember, setEditingMember] = useState<MEMBER.WorkspaceMember | null>(null)
    const [nextRole, setNextRole] = useState<MEMBER.MemberRole>("member")
    const [addForm] = Form.useForm()

    const openAddMemberModal = () => {
        addForm.resetFields()
        setAddModalOpen(true)
    }

    const handleCreateMember = async () => {
        try {
            const values = await addForm.validateFields()
            setAddLoading(true)
            const res = await API.member.createMember({
                username: values.username,
                password: values.password,
                display_name: values.display_name || undefined,
                role: values.role,
            })
            message.success(res.message)
            setAddModalOpen(false)
            addForm.resetFields()
            loadMembers()
        } catch (e) {
            if (e instanceof Error) message.error(e.message)
        } finally {
            setAddLoading(false)
        }
    }

    const loadMembers = useCallback(async () => {
        setLoading(true)
        try {
            const res = await API.member.listWorkspaceMembers({
                page: 1,
                page_size: 100,
            })
            setMembers(res.results)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadMembers()
    }, [loadMembers])

    const openChangeRole = (record: MEMBER.WorkspaceMember) => {
        setEditingMember(record)
        setNextRole(record.role)
        setRoleModalOpen(true)
    }

    const handleConfirmRole = async () => {
        if (!editingMember) return
        await API.member.updateMemberRole({
            user_id: editingMember.user_id,
            role: nextRole,
        })
        message.success("角色已更新")
        setRoleModalOpen(false)
        setEditingMember(null)
        loadMembers()
    }

    const handleRemove = (record: MEMBER.WorkspaceMember) => {
        modal.confirm({
            title: "移除成员",
            content: `确定将「${record.name}」移出系统？此操作不可撤销。`,
            okText: "移除",
            okButtonProps: { danger: true },
            onOk: async () => {
                await API.member.removeMember({
                    user_id: record.user_id,
                })
                message.success("已移除")
                void loadMembers()
            },
        })
    }

    const columns: ColumnsType<MEMBER.WorkspaceMember> = [
        {
            title: "成员",
            dataIndex: "name",
            key: "name",
            render: (_, record) => (
                <div className="flex items-center gap-3 py-1">
                    <Avatar
                        size={38}
                        src={record.avatar_url ?? undefined}
                        icon={!record.avatar_url ? <UserOutlined /> : undefined}
                        className={!record.avatar_url ? "bg-secondary-color/20 text-primary-color" : ""}
                    >
                        {!record.avatar_url ? record.name.slice(0, 1) : null}
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-block-title-color">
                            {record.name}
                        </span>
                        <span className="text-xs text-assistant-text-color">
                            {record.email}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            title: "角色",
            dataIndex: "role",
            key: "role",
            width: 140,
            render: (role: MEMBER.MemberRole) => (
                <Tag
                    icon={ROLE_CONFIG[role].icon}
                    color={ROLE_CONFIG[role].color}
                    className="px-2.5 py-0.5"
                >
                    {ROLE_LABEL[role]}
                </Tag>
            ),
        },
        {
            title: "加入时间",
            dataIndex: "joined_at",
            key: "joined_at",
            width: 180,
            render: (joined_at: string) => (
                <span className="text-sm text-assistant-text-color">
                    <CalendarOutlined className="mr-1.5" />
                    {dayjs(joined_at).format("YYYY-MM-DD")}
                </span>
            ),
        },
        {
            title: "操作",
            key: "actions",
            width: 160,
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="更改角色">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            className="text-button-text-color hover:text-primary-color!"
                            onClick={() => openChangeRole(record)}
                        />
                    </Tooltip>
                    <Tooltip title="移除成员">
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemove(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ]

    return (
        <div className="flex h-full max-h-screen flex-col bg-page-bg-color">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 py-4">
                <span className="text-xl font-medium text-block-title-color">成员管理</span>
                <Button type="primary" icon={<PlusOutlined />} onClick={openAddMemberModal}>
                    添加成员
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-6 pb-6 scrollbar-thin scrollbar-auto-hide scrollbar-stable">
                <div className="rounded-2xl bg-card-bg-color shadow-sm">
                    {/* Card header with stats */}
                    <div className="flex items-center gap-3 border-b border-line-color px-6 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-color/10">
                            <TeamOutlined className="text-base text-primary-color" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-block-title-color">
                                空间成员
                            </span>
                            <span className="text-xs text-assistant-text-color">
                                {loading ? "加载中…" : `共 ${members.length} 位成员`}
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <Table<MEMBER.WorkspaceMember>
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={members}
                        pagination={false}
                        size="middle"
                        className="[&_.ant-table]:rounded-none! [&_.ant-table-thead_th]:bg-transparent! [&_.ant-table-thead_th]:text-assistant-text-color [&_.ant-table-thead_th]:text-xs [&_.ant-table-thead_th]:font-normal"
                    />
                </div>
            </div>

            {/* Role change modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <EditOutlined className="text-primary-color" />
                        <span>更改角色</span>
                    </div>
                }
                open={roleModalOpen}
                onOk={() => void handleConfirmRole()}
                onCancel={() => {
                    setRoleModalOpen(false)
                    setEditingMember(null)
                }}
                okText="确认更改"
                destroyOnHidden
            >
                {editingMember && (
                    <div className="my-4 flex items-center gap-3 rounded-xl border border-line-color bg-default-bg-color p-4">
                        <Avatar
                            size={40}
                            src={editingMember.avatar_url ?? undefined}
                            icon={!editingMember.avatar_url ? <UserOutlined /> : undefined}
                            className={!editingMember.avatar_url ? "bg-secondary-color/20 text-primary-color" : ""}
                        >
                            {!editingMember.avatar_url ? editingMember.name.slice(0, 1) : null}
                        </Avatar>
                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-block-title-color">
                                {editingMember.name}
                            </span>
                            <span className="text-xs text-assistant-text-color">
                                {editingMember.email}
                            </span>
                        </div>
                    </div>
                )}
                <div className="mb-1.5 text-sm text-assistant-text-color">选择新角色</div>
                <Select<MEMBER.MemberRole>
                    className="w-full"
                    value={nextRole}
                    onChange={setNextRole}
                    options={[
                        {
                            value: "admin",
                            label: (
                                <Space>
                                    <CrownOutlined className="text-primary-color" />
                                    {ROLE_LABEL.admin}
                                </Space>
                            ),
                        },
                        {
                            value: "member",
                            label: (
                                <Space>
                                    <UserOutlined className="text-assistant-text-color" />
                                    {ROLE_LABEL.member}
                                </Space>
                            ),
                        },
                    ]}
                />
            </Modal>

            {/* Create member modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <PlusOutlined className="text-primary-color" />
                        <span>添加成员</span>
                    </div>
                }
                open={addModalOpen}
                onOk={() => void handleCreateMember()}
                okText="创建"
                confirmLoading={addLoading}
                onCancel={() => {
                    setAddModalOpen(false)
                    addForm.resetFields()
                }}
                destroyOnHidden
                width={480}
            >
                <p className="mb-4 text-sm text-assistant-text-color">
                    创建一个新成员账号，该成员可以使用用户名和密码登录系统。
                </p>
                <Form
                    form={addForm}
                    layout="vertical"
                    requiredMark={false}
                    initialValues={{ role: "member" }}
                >
                    <Form.Item
                        name="username"
                        label="用户名"
                        rules={[
                            { required: true, message: "请输入用户名" },
                            { min: 2, message: "用户名至少 2 个字符" },
                            { max: 50, message: "用户名最多 50 个字符" },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-assistant-text-color" />}
                            placeholder="输入用户名，用于登录"
                            autoComplete="off"
                        />
                    </Form.Item>

                    <Form.Item
                        name="display_name"
                        label="昵称"
                    >
                        <Input
                            prefix={<SmileOutlined className="text-assistant-text-color" />}
                            placeholder="选填，不填则与用户名相同"
                            autoComplete="off"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="密码"
                        rules={[
                            { required: true, message: "请输入密码" },
                            { min: 6, message: "密码至少 6 个字符" },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-assistant-text-color" />}
                            placeholder="至少 6 个字符"
                            autoComplete="new-password"
                        />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="角色"
                    >
                        <Select
                            options={[
                                {
                                    value: "member",
                                    label: (
                                        <Space>
                                            <UserOutlined className="text-assistant-text-color" />
                                            普通成员
                                        </Space>
                                    ),
                                },
                                {
                                    value: "admin",
                                    label: (
                                        <Space>
                                            <CrownOutlined className="text-primary-color" />
                                            管理员
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
