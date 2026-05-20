import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'

export async function GET() {
  try {
    const prisma = getAssetsPrisma()
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
      SELECT id::text, name
      FROM tags
      ORDER BY name ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('[asset-management/tags/all][GET]', error)
    return NextResponse.json({ error: '获取标签列表失败' }, { status: 500 })
  }
}
