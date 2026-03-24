import { MEMBER } from './typing'

const mockDelay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK_WORKSPACE_ID = 'mock-workspace'

/** 模拟组织用户目录（含当前空间成员与可搜索到的其他用户） */
const mockOrgUsers: MEMBER.OrgUser[] = [
  { user_id: 'u1', name: '宋雨星', email: 'yuxingsong@gmail.com' },
  { user_id: 'u2', name: '许汉平', email: 'hanpingxu@gmail.com' },
  { user_id: 'u3', name: '张明', email: 'zhangming@gmail.com' },
  { user_id: 'u4', name: '李华', email: 'lihua@gmail.com' },
  { user_id: 'u5', name: '王芳', email: 'wangfang@gmail.com' },
  { user_id: 'u6', name: '赵六', email: 'zhaoliu@gmail.com' },
  { user_id: 'u7', name: '钱七', email: 'qianqi@gmail.com' },
  { user_id: 'u8', name: '周八', email: 'zhouba@mail.com' },
]

let mockMembers: MEMBER.WorkspaceMember[] = [
  {
    id: 'm1',
    user_id: 'u1',
    name: '宋雨星',
    email: 'yuxingsong@gmail.com',
    role: 'admin',
    joined_at: '2025-10-23T00:00:00.000Z',
  },
  {
    id: 'm2',
    user_id: 'u2',
    name: '许汉平',
    email: 'hanpingxu@gmail.com',
    role: 'admin',
    joined_at: '2025-09-15T00:00:00.000Z',
  },
  {
    id: 'm3',
    user_id: 'u3',
    name: '张明',
    email: 'zhangming@gmail.com',
    role: 'member',
    joined_at: '2025-08-01T00:00:00.000Z',
  },
  {
    id: 'm4',
    user_id: 'u4',
    name: '李华',
    email: 'lihua@gmail.com',
    role: 'member',
    joined_at: '2025-07-12T00:00:00.000Z',
  },
  {
    id: 'm5',
    user_id: 'u5',
    name: '王芳',
    email: 'wangfang@gmail.com',
    role: 'member',
    joined_at: '2025-06-20T00:00:00.000Z',
  },
]

export const memberService = {
  /** 按邮箱 / 姓名关键字搜索可邀请的用户 */
  async searchUsers(params: MEMBER.SearchUsersParams): Promise<MEMBER.SearchUsersResponse> {
    await mockDelay(250)
    const raw = params.keyword.trim()
    if (!raw) {
      return { results: [] }
    }
    const lower = raw.toLowerCase()
    const memberIds = params.workspace_id
      ? new Set(mockMembers.map((m) => m.user_id))
      : undefined
    const filtered = mockOrgUsers.filter((u) => {
      if (memberIds?.has(u.user_id)) return false
      return (
        u.email.toLowerCase().includes(lower) ||
        u.name.includes(raw) ||
        u.user_id.toLowerCase().includes(lower)
      )
    })
    return { results: filtered.slice(0, 20) }
  },

  /** 将已选用户加入空间（按 user_id） */
  async inviteUsers(params: MEMBER.InviteUsersParams): Promise<MEMBER.ApiMessage> {
    await mockDelay()
    const role = params.role ?? 'member'
    const byId = new Map(mockOrgUsers.map((u) => [u.user_id, u]))
    const existing = new Set(mockMembers.map((m) => m.user_id))
    const toAdd: MEMBER.WorkspaceMember[] = []
    let seq = mockMembers.length
    for (const id of params.user_ids) {
      if (existing.has(id)) continue
      const u = byId.get(id)
      if (!u) continue
      seq += 1
      toAdd.push({
        id: `m_inv_${seq}_${id}`,
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        avatar_url: u.avatar_url ?? null,
        role,
        joined_at: new Date().toISOString(),
      })
      existing.add(id)
    }
    mockMembers = [...mockMembers, ...toAdd]
    return { message: toAdd.length ? '邀请已发送' : '没有可添加的用户' }
  },

  /** 分页查询工作空间成员列表 */
  async listWorkspaceMembers(
    params: MEMBER.ListWorkspaceMembersParams
  ): Promise<MEMBER.ListWorkspaceMembersResponse> {
    await mockDelay()
    const page = params.page ?? 1
    const page_size = params.page_size ?? 20
    const start = (page - 1) * page_size
    const slice = mockMembers.slice(start, start + page_size)
    return {
      page,
      page_size,
      total_count: mockMembers.length,
      results: slice,
    }
  },

  /** 更新成员角色 */
  async updateMemberRole(params: MEMBER.UpdateMemberRoleParams): Promise<MEMBER.ApiMessage> {
    await mockDelay()
    mockMembers = mockMembers.map((m) =>
      m.user_id === params.user_id ? { ...m, role: params.role } : m
    )
    return { message: '角色已更新' }
  },

  /** 移除成员 */
  async removeMember(params: MEMBER.RemoveMemberParams): Promise<MEMBER.ApiMessage> {
    await mockDelay()
    mockMembers = mockMembers.filter((m) => m.user_id !== params.user_id)
    return { message: '成员已移除' }
  },

  /** 邀请成员加入空间 */
  async addMembers(params: MEMBER.AddMembersParams): Promise<MEMBER.ApiMessage> {
    await mockDelay()
    const role = params.role ?? 'member'
    const base = mockMembers.length
    const newOnes: MEMBER.WorkspaceMember[] = params.emails.map((email, i) => ({
      id: `m_new_${base + i}`,
      user_id: `u_new_${base + i}`,
      name: email.split('@')[0] ?? '新成员',
      email,
      role,
      joined_at: new Date().toISOString(),
    }))
    mockMembers = [...mockMembers, ...newOnes]
    return { message: '邀请已发送' }
  },

  /** 删除工作空间（占位） */
  async deleteWorkspace(_params: MEMBER.DeleteWorkspaceParams): Promise<MEMBER.ApiMessage> {
    await mockDelay()
    return { message: '空间已删除' }
  },

  /** 判断某角色是否具备指定权限（前端鉴权展示用） */
  roleHasPermission(role: MEMBER.MemberRole, permission: MEMBER.WorkspacePermission): boolean {
    return MEMBER.ROLE_PERMISSIONS[role].includes(permission)
  },
}

export { MOCK_WORKSPACE_ID }
