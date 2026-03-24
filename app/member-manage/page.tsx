"use client"

import {
    CalendarOutlined,
    DeleteOutlined,
    MailOutlined,
    PlusOutlined,
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
    Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useCallback, useEffect, useState } from "react"
import { API } from "@/service"
import type { MEMBER } from "@/service/member/typing"
import { MOCK_WORKSPACE_ID } from "@/service/member"

const { Link: TextLink, Text } = Typography

const ROLE_LABEL: Record<MEMBER.MemberRole, string> = {
    admin: "管理员",
    member: "普通成员",
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
            const res = await API.member.searchUsers({
                keyword,
                workspace_id: MOCK_WORKSPACE_ID,
            })
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
                workspace_id: MOCK_WORKSPACE_ID,
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
            workspace_id: MOCK_WORKSPACE_ID,
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
            content: `确定将「${record.name}」移出当前工作空间？`,
            okText: "移除",
            okButtonProps: { danger: true },
            onOk: async () => {
                await API.member.removeMember({
                    workspace_id: MOCK_WORKSPACE_ID,
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
            workspace_id: MOCK_WORKSPACE_ID,
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

    const handleDeleteWorkspace = () => {
        modal.confirm({
            title: "删除工作空间",
            content: "删除后空间内数据将无法恢复，确定继续？",
            okText: "删除",
            okButtonProps: { danger: true },
            onOk: async () => {
                await API.member.deleteWorkspace({ workspace_id: MOCK_WORKSPACE_ID })
                message.success("空间已删除（演示）")
            },
        })
    }

    const columns: ColumnsType<MEMBER.WorkspaceMember> = [
        {
            title: "成员",
            dataIndex: "name",
            key: "name",
            render: (_, record) => (
                <Space size={12}>
                    <Avatar
                        size={32}
                        src={record.avatar_url ?? undefined}
                        icon={!record.avatar_url ? <UserOutlined /> : undefined}
                    >
                        {!record.avatar_url ? record.name.slice(0, 1) : null}
                    </Avatar>
                    <span>{record.name}</span>
                </Space>
            ),
        },
        {
            title: "邮箱",
            dataIndex: "email",
            key: "email",
            render: (email: string) => (
                <Space size={8}>
                    <MailOutlined className="text-assistant-text-color" />
                    <span>{email}</span>
                </Space>
            ),
        },
        {
            title: "角色",
            dataIndex: "role",
            key: "role",
            width: 120,
            render: (role: MEMBER.MemberRole) => ROLE_LABEL[role],
        },
        {
            title: "加入时间",
            dataIndex: "joined_at",
            key: "joined_at",
            width: 160,
            render: (joined_at: string) => (
                <Space size={8}>
                    <CalendarOutlined className="text-assistant-text-color" />
                    <span>{dayjs(joined_at).format("MM/DD/YYYY")}</span>
                </Space>
            ),
        },
        {
            title: "操作",
            key: "actions",
            width: 200,
            render: (_, record) => (
                <Space size={0} separator={<Text type="secondary">|</Text>}>
                    <TextLink className="text-primary-color!" onClick={() => openChangeRole(record)}>
                        更改角色
                    </TextLink>
                    <TextLink type="danger" onClick={() => handleRemove(record)}>
                        移除
                    </TextLink>
                </Space>
            ),
        },
    ]

    return (
        <div className="flex h-full max-h-screen flex-col bg-default-bg-color">
            <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 py-4 my-4">
                <Space size={16} align="center">
                    <span className="text-xl font-medium text-block-title-color">工作空间管理</span>
                    {/* <Button type="text" danger icon={<DeleteOutlined />} onClick={handleDeleteWorkspace}>
                        删除空间
                    </Button> */}
                </Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={openAddMemberModal}>
                    添加成员
                </Button>
            </div>

            <div className="flex-1 overflow-auto px-6 pb-6 scrollbar-thin scrollbar-auto-hide scrollbar-stable">
                <Table<MEMBER.WorkspaceMember>
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={members}
                    pagination={false}
                    size="middle"
                />
            </div>

            <Modal
                title="更改角色"
                open={roleModalOpen}
                onOk={() => void handleConfirmRole()}
                onCancel={() => {
                    setRoleModalOpen(false)
                    setEditingMember(null)
                }}
                destroyOnHidden
            >
                <p className="mb-3 text-assistant-text-color">
                    成员：{editingMember?.name}（{editingMember?.email}）
                </p>
                <Select<MEMBER.MemberRole>
                    className="w-full"
                    value={nextRole}
                    onChange={setNextRole}
                    options={[
                        { value: "admin", label: ROLE_LABEL.admin },
                        { value: "member", label: ROLE_LABEL.member },
                    ]}
                />
            </Modal>

            <Modal
                title="添加成员"
                open={addModalOpen}
                onOk={() => void handleAddMembers()}
                onCancel={() => {
                    setAddModalOpen(false)
                    resetAddMemberModal()
                }}
                destroyOnHidden
            >
                <p className="mb-3 text-sm text-assistant-text-color">
                    输入邮箱或姓名后查询，在结果中勾选需要加入空间的用户。
                </p>
                <Input.Search
                    placeholder="输入邮箱或姓名搜索"
                    value={inviteKeyword}
                    onChange={(e) => setInviteKeyword(e.target.value)}
                    onSearch={() => void runUserSearch()}
                    loading={searching}
                    allowClear
                    enterButton="查询"
                />
                <div className="mt-4 min-h-[160px]">
                    {searching ? (
                        <div className="flex justify-center py-10">
                            <Spin />
                        </div>
                    ) : hasSearched && searchHits.length === 0 ? (
                        <Empty className="py-6" description="未找到可邀请的用户" />
                    ) : searchHits.length > 0 ? (
                        <List
                            className="max-h-[280px] overflow-y-auto"
                            dataSource={searchHits}
                            renderItem={(user) => (
                                <List.Item className="px-0!">
                                    <Checkbox
                                        checked={selectedUserIds.includes(user.user_id)}
                                        onChange={(e) =>
                                            toggleSelectedUser(user.user_id, e.target.checked)
                                        }
                                    >
                                        <Space size={12} className="ml-2">
                                            <Avatar
                                                size={36}
                                                src={user.avatar_url ?? undefined}
                                                icon={!user.avatar_url ? <UserOutlined /> : undefined}
                                            >
                                                {!user.avatar_url ? user.name.slice(0, 1) : null}
                                            </Avatar>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-block-title-color font-medium">
                                                    {user.name}
                                                </span>
                                                <Space size={6} className="text-assistant-text-color text-sm">
                                                    <MailOutlined />
                                                    <span>{user.email}</span>
                                                </Space>
                                            </div>
                                        </Space>
                                    </Checkbox>
                                </List.Item>
                            )}
                        />
                    ) : null}
                </div>
            </Modal>
        </div>
    )
}
