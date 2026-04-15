import { MEMBER } from './typing'

const requestJson = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const res = await fetch(input, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : res.statusText || '请求失败')
  }
  return data as T
}

export const memberService = {
  async searchUsers(params: MEMBER.SearchUsersParams): Promise<MEMBER.SearchUsersResponse> {
    return requestJson<MEMBER.SearchUsersResponse>('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', keyword: params.keyword }),
    })
  },

  async inviteUsers(params: MEMBER.InviteUsersParams): Promise<MEMBER.ApiMessage> {
    return requestJson<MEMBER.ApiMessage>('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        emails: params.user_ids,
        role: params.role ?? 'member',
      }),
    })
  },

  async listWorkspaceMembers(
    params: MEMBER.ListWorkspaceMembersParams,
  ): Promise<MEMBER.ListWorkspaceMembersResponse> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      page_size: String(params.page_size ?? 20),
    })
    return requestJson<MEMBER.ListWorkspaceMembersResponse>(`/api/members?${query}`)
  },

  async updateMemberRole(params: MEMBER.UpdateMemberRoleParams): Promise<MEMBER.ApiMessage> {
    return requestJson<MEMBER.ApiMessage>('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_role', user_id: params.user_id, role: params.role }),
    })
  },

  async removeMember(params: MEMBER.RemoveMemberParams): Promise<MEMBER.ApiMessage> {
    return requestJson<MEMBER.ApiMessage>('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', user_id: params.user_id }),
    })
  },

  async addMembers(params: MEMBER.AddMembersParams): Promise<MEMBER.ApiMessage> {
    return requestJson<MEMBER.ApiMessage>('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', emails: params.emails, role: params.role ?? 'member' }),
    })
  },

  roleHasPermission(role: MEMBER.MemberRole, permission: MEMBER.WorkspacePermission): boolean {
    return MEMBER.ROLE_PERMISSIONS[role].includes(permission)
  },
}
