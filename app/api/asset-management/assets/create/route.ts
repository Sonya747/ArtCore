import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string
      type?: string
      description?: string
      preview_url?: string
      tag_ids?: string[]
    }

    const name = body.name?.trim()
    if (!name) {
      return NextResponse.json({ error: '资产名称不能为空' }, { status: 400 })
    }

    const validTypes = ['character', 'weapon', 'scene', 'style', 'other']
    if (body.type && !validTypes.includes(body.type)) {
      return NextResponse.json({ error: '无效的资产类型' }, { status: 400 })
    }

    const prisma = getAssetsPrisma()
    const assetId = randomUUID()

    await prisma.$executeRaw`
      INSERT INTO assets (id, name, type, description, preview_url, created_at)
      VALUES (
        ${assetId}::uuid,
        ${name},
        ${body.type || null},
        ${body.description?.trim() || null},
        ${body.preview_url?.trim() || null},
        NOW()
      )
    `

    const tagIds = body.tag_ids?.filter(Boolean) ?? []
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        await prisma.$executeRaw`
          INSERT INTO asset_tag_mapping (asset_id, tag_id)
          VALUES (${assetId}::uuid, ${tagId}::uuid)
          ON CONFLICT DO NOTHING
        `
      }
    }

    return NextResponse.json({ ok: true, asset_id: assetId })
  } catch (error) {
    console.error('[asset-management/assets/create][POST]', error)
    return NextResponse.json({ error: '创建资产失败' }, { status: 500 })
  }
}
