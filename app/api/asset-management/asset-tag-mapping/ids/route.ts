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
    const mappings = await prisma.$queryRaw<Array<{ tag_id: string }>>`
      SELECT tag_id::text
      FROM asset_tag_mapping
      WHERE asset_id = ${assetId}::uuid
    `
    return NextResponse.json(mappings.map((item) => item.tag_id))
  } catch (error) {
    console.error('[asset-management/asset-tag-mapping/ids]', error)
    return NextResponse.json({ error: '查询标签失败' }, { status: 500 })
  }
}
