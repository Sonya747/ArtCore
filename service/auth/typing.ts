export namespace Auth {
  export interface UserInfo {
    id: string
    username: string
    display_name: string | null
    role: string
    created_at: string
  }

  export interface LoginParams {
    username: string
    password: string
  }

  export interface RegisterParams {
    username: string
    password: string
    display_name?: string
  }

  export interface AuthResponse {
    user: UserInfo
  }
}
