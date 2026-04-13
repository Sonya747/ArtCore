import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'
import { TaskType } from '@/service/typing'

const IMAGE_LIKE = new Set<string>([TaskType.IMAGE, TaskType.CHAT])

function shouldQueryAssets(taskTypes?: string[]): boolean {
  if (!taskTypes?.length) return true
  return taskTypes.some((t) => IMAGE_LIKE.has(t))
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      page?: number
      page_size?: number
      keyword?: string | null
      task_types?: TaskType[]
      album_id?: string | null
    }

    const page = typeof body.page === 'number' && body.page >= 0 ? body.page : 0
    const pageSize =
      typeof body.page_size === 'number' && body.page_size > 0 ? body.page_size : 20
    const keyword = body.keyword?.trim()
    const albumId = body.album_id?.trim()

    if (!shouldQueryAssets(body.task_types)) {
      return NextResponse.json({
        page,
        page_size: pageSize,
        total_count: 0,
        has_more: false,
        results: [],
      })
    }

    const prisma = getAssetsPrisma()
    let total = 0
    let rows: Array<{
      id: string
      name: string | null
      type: string | null
      description: string | null
      preview_url: string | null
      created_by: string | null
      created_at: Date
    }> = []

    if (albumId) {
      const [countRows, filteredRows] = await Promise.all([
        keyword
          ? prisma.$queryRaw<Array<{ total: bigint }>>`
              SELECT COUNT(*)::bigint AS total
              FROM assets a
              INNER JOIN asset_tag_mapping atm ON atm.asset_id = a.id
              WHERE atm.tag_id = ${albumId}::uuid
                AND (
                  COALESCE(a.name, '') ILIKE ${`%${keyword}%`}
                  OR COALESCE(a.description, '') ILIKE ${`%${keyword}%`}
                )
            `
          : prisma.$queryRaw<Array<{ total: bigint }>>`
              SELECT COUNT(*)::bigint AS total
              FROM assets a
              INNER JOIN asset_tag_mapping atm ON atm.asset_id = a.id
              WHERE atm.tag_id = ${albumId}::uuid
            `,
        keyword
          ? prisma.$queryRaw<typeof rows>`
              SELECT a.id::text, a.name, a.type, a.description, a.preview_url, a.created_by::text, a.created_at
              FROM assets a
              INNER JOIN asset_tag_mapping atm ON atm.asset_id = a.id
              WHERE atm.tag_id = ${albumId}::uuid
                AND (
                  COALESCE(a.name, '') ILIKE ${`%${keyword}%`}
                  OR COALESCE(a.description, '') ILIKE ${`%${keyword}%`}
                )
              ORDER BY a.created_at DESC
              LIMIT ${pageSize}
              OFFSET ${page * pageSize}
            `
          : prisma.$queryRaw<typeof rows>`
              SELECT a.id::text, a.name, a.type, a.description, a.preview_url, a.created_by::text, a.created_at
              FROM assets a
              INNER JOIN asset_tag_mapping atm ON atm.asset_id = a.id
              WHERE atm.tag_id = ${albumId}::uuid
              ORDER BY a.created_at DESC
              LIMIT ${pageSize}
              OFFSET ${page * pageSize}
            `,
      ])
      total = Number(countRows[0]?.total ?? BigInt(0))
      rows = filteredRows
    } else {
      const where: Prisma.AssetWhereInput = {}
      if (keyword) {
        where.OR = [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ]
      }
      const [count, foundRows] = await Promise.all([
        prisma.asset.count({ where }),
        prisma.asset.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: page * pageSize,
          take: pageSize,
        }),
      ])
      total = count
      rows = foundRows
    }

    const results = rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      description: r.description,
      preview_url: r.preview_url,
      created_by: r.created_by,
      created_at: r.created_at.toISOString(),
    }))

    return NextResponse.json({
      page,
      page_size: pageSize,
      total_count: total,
      has_more: total > (page + 1) * pageSize,
      results,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : '查询资产失败'
    console.error('[asset-management/assets]', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
