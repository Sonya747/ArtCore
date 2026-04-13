import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { asset_ids?: string[]; album_ids?: string[] }
    const assetIds = (body.asset_ids ?? []).filter(Boolean)
    const albumIds = (body.album_ids ?? []).filter(Boolean)
    if (assetIds.length === 0 || albumIds.length === 0) {
      return NextResponse.json({ error: 'asset_ids 和 album_ids 不能为空' }, { status: 400 })
    }
    const prisma = getAssetsPrisma()
    for (const assetId of assetIds) {
      for (const albumId of albumIds) {
        await prisma.$executeRaw`
          INSERT INTO asset_tag_mapping (asset_id, tag_id)
          VALUES (${assetId}::uuid, ${albumId}::uuid)
          ON CONFLICT (asset_id, tag_id) DO NOTHING
        `
      }
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[asset-management/asset-tag-mapping/add]', error)
    return NextResponse.json({ error: '添加标签失败' }, { status: 500 })
  }
}
