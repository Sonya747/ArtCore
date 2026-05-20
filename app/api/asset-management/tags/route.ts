import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(0, Number(searchParams.get('page') ?? '0'))
    const pageSize = Math.max(1, Number(searchParams.get('page_size') ?? '20'))
    const keyword = searchParams.get('keyword')?.trim()
    const prisma = getAssetsPrisma()

    const [countRows, rows] = await Promise.all([
      keyword
        ? prisma.$queryRaw<Array<{ total: bigint }>>`
            SELECT COUNT(*)::bigint AS total
            FROM tags
            WHERE name ILIKE ${`%${keyword}%`}
          `
        : prisma.$queryRaw<Array<{ total: bigint }>>`
            SELECT COUNT(*)::bigint AS total
            FROM tags
          `,
      keyword
        ? prisma.$queryRaw<Array<{ id: string; name: string | null }>>`
            SELECT id::text, name
            FROM tags
            WHERE name ILIKE ${`%${keyword}%`}
            ORDER BY name ASC
            LIMIT ${pageSize}
            OFFSET ${page * pageSize}
          `
        : prisma.$queryRaw<Array<{ id: string; name: string | null }>>`
            SELECT id::text, name
            FROM tags
            ORDER BY name ASC
            LIMIT ${pageSize}
            OFFSET ${page * pageSize}
          `,
    ])
    const total = Number(countRows[0]?.total ?? BigInt(0))

    return NextResponse.json({
      page,
      page_size: pageSize,
      total_count: total,
      results: rows.map((row) => ({
        album_id: row.id,
        name: row.name ?? '',
        cover_urls: [],
        is_default: false,
      })),
    })
  } catch (error) {
    console.error('[asset-management/tags][GET]', error)
    return NextResponse.json({ error: '获取标签列表失败' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string }
    const name = body.name?.trim()
    if (!name) {
      return NextResponse.json({ error: '名称不能为空' }, { status: 400 })
    }
    const prisma = getAssetsPrisma()
    const id = randomUUID()
    await prisma.$executeRaw`
      INSERT INTO tags (id, name)
      VALUES (${id}::uuid, ${name})
    `
    return NextResponse.json({ ok: true, id, name })
  } catch (error) {
    console.error('[asset-management/tags][POST]', error)
    return NextResponse.json({ error: '创建标签失败' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as { album_id?: string; name?: string }
    const albumId = body.album_id?.trim()
    const name = body.name?.trim()
    if (!albumId || !name) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }
    const prisma = getAssetsPrisma()
    await prisma.$executeRaw`
      UPDATE tags
      SET name = ${name}
      WHERE id = ${albumId}::uuid
    `
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[asset-management/tags][PATCH]', error)
    return NextResponse.json({ error: '重命名标签失败' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { album_id?: string }
    const albumId = body.album_id?.trim()
    if (!albumId) {
      return NextResponse.json({ error: 'album_id 不能为空' }, { status: 400 })
    }
    const prisma = getAssetsPrisma()
    await prisma.$executeRaw`
      DELETE FROM tags
      WHERE id = ${albumId}::uuid
    `
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[asset-management/tags][DELETE]', error)
    return NextResponse.json({ error: '删除标签失败' }, { status: 500 })
  }
}
