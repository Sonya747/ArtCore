import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { asset_id?: string }
    const assetId = body.asset_id?.trim()
    if (!assetId) {
      return NextResponse.json({ error: 'asset_id 不能为空' }, { status: 400 })
    }
    const prisma = getAssetsPrisma()
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string | null }>>`
      SELECT t.id::text, t.name
      FROM tags t
      INNER JOIN asset_tag_mapping atm ON atm.tag_id = t.id
      WHERE atm.asset_id = ${assetId}::uuid
      ORDER BY t.name ASC
    `
    return NextResponse.json(rows.map((row) => ({ id: row.id, name: row.name ?? '' })))
  } catch (error) {
    console.error('[asset-management/asset-tags][POST]', error)
    return NextResponse.json({ error: '查询资产标签失败' }, { status: 500 })
  }
}
