import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'
import { verifyPassword, createToken, TOKEN_COOKIE, TOKEN_MAX_AGE } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
    }

    const prisma = getAssetsPrisma()
    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    })

    if (!user || user.password_hash === 'pending') {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const token = createToken(user.id)
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        created_at: user.created_at.toISOString(),
      },
    })

    response.cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TOKEN_MAX_AGE,
      path: '/',
    })

    return response
  } catch (e) {
    console.error('[api/auth/login]', e)
    const msg = e instanceof Error ? e.message : '登录失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
