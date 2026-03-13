import { ls } from './localStorage'

//TODO 修改
// 使用idaas登录
export const getIdaasLoginUrl = () => {
  const target_url = btoa(window.location.pathname + window.location.search)
  return `${process.env.PUBLIC_SSO_URL}&redirect_uri=${location.origin}/login&target_url=${target_url}`
}

export const login = () => {
  window.location.href = getIdaasLoginUrl()
}

export const logout = () => {
  ls.remove('id_token')
  window.location.href = `${window.location.origin}/login`
}
