import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const prisma = getAssetsPrisma()
    const tasks = await prisma.generationTask.findMany({
      where: {
        user_id: auth.userId,
        status: 'success',
      },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        generated_images: { orderBy: { sort_order: 'asc' }, take: 1 },
      },
    })

    const results = tasks.map((t) => ({
      id: t.id,
      raw_prompt: t.raw_prompt,
      final_prompt: t.final_prompt,
      model_name: t.model_name,
      image_size: t.image_size,
      request_params: t.request_params as Record<string, unknown> | null,
      image_url: t.image_url ?? t.generated_images[0]?.image_url ?? null,
      thumbnail_url: t.generated_images[0]?.image_url ?? null,
      created_at: t.created_at.toISOString(),
      status: t.status,
    }))

    return NextResponse.json({ results })
  } catch (e) {
    console.error('[api/reviews/reviewable-tasks GET]', e)
    const msg = e instanceof Error ? e.message : '查询任务失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
