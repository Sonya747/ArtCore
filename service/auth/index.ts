import type { Auth } from './typing'

export async function loginApi(params: Auth.LoginParams): Promise<Auth.AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '登录失败')
  return data
}

export async function registerApi(params: Auth.RegisterParams): Promise<Auth.AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '注册失败')
  return data
}

export async function getMeApi(): Promise<Auth.UserInfo | null> {
  const res = await fetch('/api/auth/me')
  if (!res.ok) return null
  const data = await res.json()
  return data.user
}

export async function logoutApi(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}
