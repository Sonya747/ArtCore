import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'

export async function GET(req: Request) {
  try {
    const prisma = getAssetsPrisma()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const pageSize = Math.max(1, Number(searchParams.get('page_size') ?? 20))
    const keyword = searchParams.get('keyword')?.trim()

    const where = keyword
      ? {
          OR: [
            { username: { contains: keyword, mode: 'insensitive' as const } },
            { display_name: { contains: keyword, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const results = rows.map((u) => ({
      id: u.id,
      user_id: u.id,
      name: u.display_name ?? u.username,
      email: u.username,
      role: u.role,
      joined_at: u.created_at.toISOString(),
    }))

    return NextResponse.json({
      page,
      page_size: pageSize,
      total_count: total,
      results,
    })
  } catch (e) {
    console.error('[api/members GET]', e)
    const msg = e instanceof Error ? e.message : '查询成员失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const prisma = getAssetsPrisma()
    const body = await req.json()
    const action = body.action as string

    if (action === 'add') {
      const emails: string[] = body.emails ?? []
      const role: string = body.role ?? 'member'
      let added = 0
      for (const email of emails) {
        const exists = await prisma.user.findUnique({ where: { username: email } })
        if (exists) continue
        await prisma.user.create({
          data: {
            username: email,
            password_hash: 'pending',
            display_name: email.split('@')[0] ?? email,
            role,
          },
        })
        added++
      }
      return NextResponse.json({ message: added > 0 ? `已添加 ${added} 位成员` : '没有新成员被添加' })
    }

    if (action === 'update_role') {
      const userId: string = body.user_id
      const role: string = body.role
      await prisma.user.update({
        where: { id: userId },
        data: { role },
      })
      return NextResponse.json({ message: '角色已更新' })
    }

    if (action === 'remove') {
      const userId: string = body.user_id
      await prisma.user.delete({ where: { id: userId } })
      return NextResponse.json({ message: '成员已移除' })
    }

    if (action === 'search') {
      const keyword: string = (body.keyword ?? '').trim()
      if (!keyword) return NextResponse.json({ results: [] })
      const rows = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: keyword, mode: 'insensitive' } },
            { display_name: { contains: keyword, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { created_at: 'desc' },
      })
      const results = rows.map((u) => ({
        user_id: u.id,
        name: u.display_name ?? u.username,
        email: u.username,
      }))
      return NextResponse.json({ results })
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 })
  } catch (e) {
    console.error('[api/members POST]', e)
    const msg = e instanceof Error ? e.message : '操作失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
