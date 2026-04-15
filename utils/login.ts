import { logoutApi } from '@/service/auth'

export const login = () => {
  window.location.href = '/login'
}

export const logout = async () => {
  try {
    await logoutApi()
  } catch {
    // ignore
  }
  window.location.href = '/login'
}
