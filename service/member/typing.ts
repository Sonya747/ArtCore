export namespace MEMBER {
  export type MemberRole = 'admin' | 'member'

  export type WorkspacePermission =
    | 'workspace:read'
    | 'workspace:manage'
    | 'member:read'
    | 'member:invite'
    | 'member:remove'
    | 'member:role'
    | 'asset:read'
    | 'asset:write'

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
    joined_at: string
  }

  export interface ListWorkspaceMembersParams {
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
    user_id: string
    role: MemberRole
  }

  export interface RemoveMemberParams {
    user_id: string
  }

  export interface AddMembersParams {
    emails: string[]
    role?: MemberRole
  }

  export interface OrgUser {
    user_id: string
    name: string
    email: string
    avatar_url?: string | null
  }

  export interface SearchUsersParams {
    keyword: string
  }

  export interface SearchUsersResponse {
    results: OrgUser[]
  }

  export interface InviteUsersParams {
    user_ids: string[]
    role?: MemberRole
  }

  export interface CreateMemberParams {
    username: string
    password: string
    display_name?: string
    role?: MemberRole
  }

  export interface ApiMessage {
    message: string
  }
}
