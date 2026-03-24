/**
 * 成员与工作空间权限相关类型定义
 */
export namespace MEMBER {
  /** 成员在空间内的角色 */
  export type MemberRole = 'admin' | 'member'

  /**
   * 工作空间级权限点（用于前后端对齐与扩展）
   */
  export type WorkspacePermission =
    | 'workspace:read'
    | 'workspace:manage'
    | 'member:read'
    | 'member:invite'
    | 'member:remove'
    | 'member:role'
    | 'asset:read'
    | 'asset:write'

  /** 各角色默认具备的权限集合 */
  export const ROLE_PERMISSIONS: Record<MemberRole, WorkspacePermission[]> = {
    admin: [
      'workspace:read',
      'workspace:manage',
      'member:read',
      'member:invite',
      'member:remove',
      'member:role',
      'asset:read',
      'asset:write',
    ],
    member: ['workspace:read', 'member:read', 'asset:read', 'asset:write'],
  }

  export interface WorkspaceMember {
    id: string
    user_id: string
    name: string
    email: string
    avatar_url?: string | null
    role: MemberRole
    /** ISO 8601，展示时格式化为 MM/DD/YYYY */
    joined_at: string
  }

  export interface ListWorkspaceMembersParams {
    workspace_id: string
    page?: number
    page_size?: number
  }

  export interface ListWorkspaceMembersResponse {
    page: number
    page_size: number
    total_count: number
    results: WorkspaceMember[]
  }

  export interface UpdateMemberRoleParams {
    workspace_id: string
    user_id: string
    role: MemberRole
  }

  export interface RemoveMemberParams {
    workspace_id: string
    user_id: string
  }

  export interface AddMembersParams {
    workspace_id: string
    emails: string[]
    role?: MemberRole
  }

  /** 组织用户目录中的用户（搜索 / 邀请用） */
  export interface OrgUser {
    user_id: string
    name: string
    email: string
    avatar_url?: string | null
  }

  export interface SearchUsersParams {
    keyword: string
    /** 传入时从结果中排除已是该空间成员的用户 */
    workspace_id?: string
  }

  export interface SearchUsersResponse {
    results: OrgUser[]
  }

  export interface InviteUsersParams {
    workspace_id: string
    user_ids: string[]
    role?: MemberRole
  }

  export interface DeleteWorkspaceParams {
    workspace_id: string
  }

  export interface ApiMessage {
    message: string
  }
}
