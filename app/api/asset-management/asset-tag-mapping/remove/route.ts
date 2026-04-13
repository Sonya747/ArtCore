import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { asset_ids?: string[]; album_id?: string }
    const assetIds = (body.asset_ids ?? []).filter(Boolean)
    const albumId = body.album_id?.trim()
    if (assetIds.length === 0 || !albumId) {
      return NextResponse.json({ error: 'asset_ids 和 album_id 不能为空' }, { status: 400 })
    }
    const prisma = getAssetsPrisma()
    for (const assetId of assetIds) {
      await prisma.$executeRaw`
        DELETE FROM asset_tag_mapping
        WHERE asset_id = ${assetId}::uuid
          AND tag_id = ${albumId}::uuid
      `
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[asset-management/asset-tag-mapping/remove]', error)
    return NextResponse.json({ error: '移除标签失败' }, { status: 500 })
  }
}
