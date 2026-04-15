import { NextResponse } from 'next/server'
import { TOKEN_COOKIE } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ message: '已退出登录' })
  response.cookies.set(TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
