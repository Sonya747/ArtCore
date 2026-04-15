import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'
import { hashPassword, createToken, TOKEN_COOKIE, TOKEN_MAX_AGE } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { username, password, display_name } = await req.json()

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return NextResponse.json({ error: '用户名至少需要 2 个字符' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: '密码至少需要 6 个字符' }, { status: 400 })
    }

    const prisma = getAssetsPrisma()
    const existing = await prisma.user.findUnique({
      where: { username: username.trim() },
    })
    if (existing) {
      return NextResponse.json({ error: '该用户名已被注册' }, { status: 409 })
    }

    const password_hash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password_hash,
        display_name: display_name?.trim() || username.trim(),
        role: 'admin',
      },
    })

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
    console.error('[api/auth/register]', e)
    const msg = e instanceof Error ? e.message : '注册失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
