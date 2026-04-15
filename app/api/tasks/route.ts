import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'

export async function GET(req: Request) {
  try {
    const prisma = getAssetsPrisma()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const pageSize = Math.max(1, Number(searchParams.get('page_size') ?? 20))
    const status = searchParams.get('status') || undefined

    const where = status ? { status } : {}

    const [total, rows] = await Promise.all([
      prisma.generationTask.count({ where }),
      prisma.generationTask.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const results = rows.map((t) => ({
      id: t.id,
      user_id: t.user_id,
      raw_prompt: t.raw_prompt,
      final_prompt: t.final_prompt,
      model_name: t.model_name,
      status: t.status,
      image_size: t.image_size,
      request_params: t.request_params as Record<string, unknown> | null,
      error_message: t.error_message,
      created_at: t.created_at.toISOString(),
      finished_at: t.finished_at?.toISOString() ?? null,
    }))

    return NextResponse.json({
      page,
      page_size: pageSize,
      total_count: total,
      results,
    })
  } catch (e) {
    console.error('[api/tasks GET]', e)
    const msg = e instanceof Error ? e.message : '查询任务失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const prisma = getAssetsPrisma()
    const body = await req.json()

    const isFinal = body.status === 'failed' || body.status === 'success'
    const task = await prisma.generationTask.create({
      data: {
        raw_prompt: body.raw_prompt,
        final_prompt: body.final_prompt ?? null,
        model_name: body.model_name ?? null,
        status: body.status ?? 'pending',
        image_size: body.image_size ?? null,
        request_params: body.request_params ?? null,
        error_message: body.error_message ?? null,
        finished_at: isFinal ? new Date() : null,
      },
    })

    return NextResponse.json({ id: task.id }, { status: 201 })
  } catch (e) {
    console.error('[api/tasks POST]', e)
    const msg = e instanceof Error ? e.message : '创建任务失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const prisma = getAssetsPrisma()
    const body = await req.json()
    const ids: string[] = body.ids ?? []
    if (!ids.length) {
      return NextResponse.json({ message: '没有可删除的任务' })
    }

    const { count } = await prisma.generationTask.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({
      message: count > 0 ? `已删除 ${count} 条任务` : '没有可删除的任务',
    })
  } catch (e) {
    console.error('[api/tasks DELETE]', e)
    const msg = e instanceof Error ? e.message : '删除任务失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
