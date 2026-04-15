"use client"

import {
    CalendarOutlined,
    CrownOutlined,
    DeleteOutlined,
    EditOutlined,
    MailOutlined,
    PlusOutlined,
    SearchOutlined,
    TeamOutlined,
    UserOutlined,
} from "@ant-design/icons"
import {
    App,
    Avatar,
    Button,
    Checkbox,
    Empty,
    Input,
    List,
    Modal,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useCallback, useEffect, useState } from "react"
import { API } from "@/service"
import type { MEMBER } from "@/service/member/typing"

const { Text } = Typography

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
    const [editingMember, setEditingMember] = useState<MEMBER.WorkspaceMember | null>(null)
    const [nextRole, setNextRole] = useState<MEMBER.MemberRole>("member")
    const [inviteKeyword, setInviteKeyword] = useState("")
    const [searching, setSearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [searchHits, setSearchHits] = useState<MEMBER.OrgUser[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

    const resetAddMemberModal = () => {
        setInviteKeyword("")
        setSearching(false)
        setHasSearched(false)
        setSearchHits([])
        setSelectedUserIds([])
    }

    const openAddMemberModal = () => {
        resetAddMemberModal()
        setAddModalOpen(true)
    }

    const runUserSearch = async () => {
        const keyword = inviteKeyword.trim()
        if (!keyword) {
            message.warning("请输入邮箱或姓名")
            return
        }
        setSearching(true)
        setHasSearched(true)
        try {
            const res = await API.member.searchUsers({ keyword })
            setSearchHits(res.results)
            setSelectedUserIds([])
        } finally {
            setSearching(false)
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

    const handleAddMembers = async () => {
        if (!selectedUserIds.length) {
            message.warning("请先搜索并勾选要添加的成员")
            return
        }
        const res = await API.member.inviteUsers({
            user_ids: selectedUserIds,
            role: "member",
        })
        message.success(res.message)
        setAddModalOpen(false)
        resetAddMemberModal()
        loadMembers()
    }

    const toggleSelectedUser = (userId: string, checked: boolean) => {
        setSelectedUserIds((prev) =>
            checked ? [...prev, userId] : prev.filter((id) => id !== userId)
        )
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

            {/* Add member modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <PlusOutlined className="text-primary-color" />
                        <span>添加成员</span>
                    </div>
                }
                open={addModalOpen}
                onOk={() => void handleAddMembers()}
                okText={
                    selectedUserIds.length > 0
                        ? `添加 ${selectedUserIds.length} 位成员`
                        : "添加"
                }
                okButtonProps={{ disabled: selectedUserIds.length === 0 }}
                onCancel={() => {
                    setAddModalOpen(false)
                    resetAddMemberModal()
                }}
                destroyOnHidden
                width={520}
            >
                <p className="mb-4 text-sm text-assistant-text-color">
                    输入邮箱或姓名搜索组织内的用户，勾选后添加到当前空间。
                </p>
                <Input.Search
                    prefix={<SearchOutlined className="text-assistant-text-color" />}
                    placeholder="搜索邮箱或姓名…"
                    value={inviteKeyword}
                    onChange={(e) => setInviteKeyword(e.target.value)}
                    onSearch={() => void runUserSearch()}
                    loading={searching}
                    allowClear
                    enterButton="查询"
                />
                <div className="mt-4 min-h-[180px]">
                    {searching ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12">
                            <Spin />
                            <Text type="secondary" className="text-xs">
                                搜索中…
                            </Text>
                        </div>
                    ) : hasSearched && searchHits.length === 0 ? (
                        <Empty
                            className="py-8"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="未找到可邀请的用户"
                        />
                    ) : searchHits.length > 0 ? (
                        <>
                            <div className="mb-2 text-xs text-assistant-text-color">
                                找到 {searchHits.length} 位用户
                            </div>
                            <List
                                className="max-h-[280px] overflow-y-auto rounded-xl border border-line-color"
                                dataSource={searchHits}
                                renderItem={(user) => (
                                    <List.Item
                                        className="cursor-pointer px-4! transition-colors hover:bg-default-bg-color"
                                        onClick={() =>
                                            toggleSelectedUser(
                                                user.user_id,
                                                !selectedUserIds.includes(user.user_id)
                                            )
                                        }
                                    >
                                        <div className="flex w-full items-center gap-3">
                                            <Checkbox
                                                checked={selectedUserIds.includes(user.user_id)}
                                                onChange={(e) =>
                                                    toggleSelectedUser(user.user_id, e.target.checked)
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <Avatar
                                                size={36}
                                                src={user.avatar_url ?? undefined}
                                                icon={!user.avatar_url ? <UserOutlined /> : undefined}
                                                className={!user.avatar_url ? "bg-secondary-color/20 text-primary-color" : ""}
                                            >
                                                {!user.avatar_url ? user.name.slice(0, 1) : null}
                                            </Avatar>
                                            <div className="flex flex-1 flex-col gap-0.5">
                                                <span className="text-sm font-medium text-block-title-color">
                                                    {user.name}
                                                </span>
                                                <span className="text-xs text-assistant-text-color">
                                                    <MailOutlined className="mr-1" />
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </>
                    ) : null}
                </div>
            </Modal>
        </div>
    )
}
