import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const prisma = getAssetsPrisma()
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        created_at: user.created_at.toISOString(),
      },
    })
  } catch (e) {
    console.error('[api/auth/me]', e)
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
  }
}
