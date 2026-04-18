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
    const admins = await prisma.user.findMany({
      where: {
        role: 'admin',
        NOT: { id: auth.userId },
      },
      orderBy: { created_at: 'asc' },
    })

    const results = admins.map((u) => ({
      id: u.id,
      name: u.display_name ?? u.username,
      username: u.username,
      role: u.role,
    }))

    return NextResponse.json({ results })
  } catch (e) {
    console.error('[api/reviews/reviewers GET]', e)
    const msg = e instanceof Error ? e.message : '查询审核人失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
