import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'

const VALID_TYPES = new Set(['character', 'weapon', 'scene', 'style', 'other'])

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      asset_id?: string
      name?: string
      type?: string
      description?: string
      preview_url?: string
      tag_ids?: string[]
    }

    const assetId = body.asset_id?.trim()
    const name = body.name?.trim()
    const type = body.type?.trim()
    const description = body.description?.trim()
    const previewUrl = body.preview_url?.trim()
    const tagIds = Array.from(new Set((body.tag_ids ?? []).map((id) => id.trim()).filter(Boolean)))

    if (!assetId) {
      return NextResponse.json({ error: 'asset_id 不能为空' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: '资产名称不能为空' }, { status: 400 })
    }
    if (type && !VALID_TYPES.has(type)) {
      return NextResponse.json({ error: '无效的资产类型' }, { status: 400 })
    }

    const prisma = getAssetsPrisma()

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE assets
        SET
          name = ${name},
          type = ${type || null},
          description = ${description || null},
          preview_url = ${previewUrl || null}
        WHERE id = ${assetId}::uuid
      `

      await tx.$executeRaw`
        DELETE FROM asset_tag_mapping
        WHERE asset_id = ${assetId}::uuid
      `

      for (const tagId of tagIds) {
        await tx.$executeRaw`
          INSERT INTO asset_tag_mapping (asset_id, tag_id)
          VALUES (${assetId}::uuid, ${tagId}::uuid)
          ON CONFLICT DO NOTHING
        `
      }
    })

    return NextResponse.json({ ok: true, asset_id: assetId })
  } catch (error) {
    console.error('[asset-management/assets/update][POST]', error)
    return NextResponse.json({ error: '更新资产失败' }, { status: 500 })
  }
}
