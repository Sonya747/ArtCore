import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'
import { getAuthUser } from '@/lib/auth'

type ReviewStatus = 'pending' | 'approved' | 'rejected'

function mapUser(u: {
  id: string
  display_name: string | null
  username: string
  role: string
}) {
  return {
    id: u.id,
    name: u.display_name ?? u.username,
    username: u.username,
    role: u.role,
  }
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const prisma = getAssetsPrisma()
    const me = await prisma.user.findUnique({ where: { id: auth.userId } })
    if (!me) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const tab = (searchParams.get('tab') ?? 'mine') as 'mine' | 'inbox'
    const statusParam = searchParams.get('status')
    const statusRaw =
      statusParam && statusParam !== 'all' ? (statusParam as ReviewStatus | 'finished') : undefined
    const keyword = searchParams.get('keyword')?.trim() || undefined
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const pageSize = Math.max(1, Number(searchParams.get('page_size') ?? 50))

    const where: Prisma.ApprovalRequestWhereInput = {}
    if (tab === 'mine') {
      where.submitter_id = me.id
    } else {
      where.reviewer_id = me.id
    }
    if (statusRaw === 'finished') {
      if (tab !== 'inbox') {
        return NextResponse.json(
          { error: 'finished 状态仅适用于待我审批视图' },
          { status: 400 },
        )
      }
      where.status = { in: ['approved', 'rejected'] }
    } else if (statusRaw) {
      where.status = statusRaw
    }
    if (keyword) {
      where.OR = [
        { task: { raw_prompt: { contains: keyword, mode: 'insensitive' } } },
        { submitter: { display_name: { contains: keyword, mode: 'insensitive' } } },
        { submitter: { username: { contains: keyword, mode: 'insensitive' } } },
        { reviewer: { display_name: { contains: keyword, mode: 'insensitive' } } },
        { reviewer: { username: { contains: keyword, mode: 'insensitive' } } },
      ]
    }

    const [
      total,
      rows,
      pendingInboxCount,
      pendingAsSubmitterCount,
      doneAsReviewerCount,
      rejectedAsSubmitterCount,
    ] = await Promise.all([
      prisma.approvalRequest.count({ where }),
      prisma.approvalRequest.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          submitter: true,
          reviewer: true,
          task: {
            include: {
              generated_images: {
                orderBy: { sort_order: 'asc' },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.approvalRequest.count({
        where: { reviewer_id: me.id, status: 'pending' },
      }),
      prisma.approvalRequest.count({
        where: { submitter_id: me.id, status: 'pending' },
      }),
      prisma.approvalRequest.count({
        where: {
          reviewer_id: me.id,
          status: { in: ['approved', 'rejected'] },
        },
      }),
      prisma.approvalRequest.count({
        where: { submitter_id: me.id, status: 'rejected' },
      }),
    ])

    const summary = {
      my_todo: pendingInboxCount + pendingAsSubmitterCount,
      pending_as_reviewer: pendingInboxCount,
      pending_as_submitter: pendingAsSubmitterCount,
      my_done_as_reviewer: doneAsReviewerCount,
      my_rejected_as_submitter: rejectedAsSubmitterCount,
    }

    const results = rows.map((r) => ({
      id: r.id,
      task: {
        id: r.task.id,
        raw_prompt: r.task.raw_prompt,
        final_prompt: r.task.final_prompt,
        model_name: r.task.model_name,
        image_size: r.task.image_size,
        request_params: r.task.request_params as Record<string, unknown> | null,
        thumbnail_url: r.task.generated_images[0]?.image_url ?? null,
      },
      submitter: mapUser(r.submitter),
      reviewer: r.reviewer ? mapUser(r.reviewer) : null,
      status: r.status as ReviewStatus,
      submitter_note: r.submitter_note,
      reviewer_note: r.reviewer_note,
      parent_request_id: r.parent_request_id,
      version: r.version,
      created_at: r.created_at.toISOString(),
      reviewed_at: r.reviewed_at?.toISOString() ?? null,
    }))

    return NextResponse.json({
      page,
      page_size: pageSize,
      total_count: total,
      pending_inbox_count: pendingInboxCount,
      summary,
      results,
    })
  } catch (e) {
    console.error('[api/reviews GET]', e)
    const msg = e instanceof Error ? e.message : '查询审批失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const prisma = getAssetsPrisma()
    const body = await req.json()
    const taskId: string = body.task_id
    const reviewerId: string = body.reviewer_id
    const submitterNote: string | null = (body.submitter_note ?? '').trim() || null
    const parentRequestId: string | null = body.parent_request_id ?? null

    if (!taskId) {
      return NextResponse.json({ error: '缺少 task_id' }, { status: 400 })
    }
    if (!reviewerId) {
      return NextResponse.json({ error: '请选择审核人' }, { status: 400 })
    }

    const task = await prisma.generationTask.findUnique({ where: { id: taskId } })
    if (!task) {
      return NextResponse.json({ error: '生成任务不存在' }, { status: 404 })
    }

    const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } })
    if (!reviewer) {
      return NextResponse.json({ error: '审核人不存在' }, { status: 404 })
    }
    if (reviewer.role !== 'admin') {
      return NextResponse.json({ error: '只能提交给管理员审核' }, { status: 400 })
    }
    if (reviewer.id === auth.userId) {
      return NextResponse.json({ error: '不能把审批提交给自己' }, { status: 400 })
    }

    let version = 1
    if (parentRequestId) {
      const parent = await prisma.approvalRequest.findUnique({
        where: { id: parentRequestId },
      })
      if (!parent) {
        return NextResponse.json({ error: '关联的历史审批不存在' }, { status: 404 })
      }
      if (parent.submitter_id !== auth.userId) {
        return NextResponse.json({ error: '无权基于他人审批重新提交' }, { status: 403 })
      }
      if (parent.status !== 'rejected') {
        return NextResponse.json({ error: '仅已驳回的审批才能重新提交' }, { status: 400 })
      }
      version = parent.version + 1
    }

    const created = await prisma.approvalRequest.create({
      data: {
        task_id: taskId,
        submitter_id: auth.userId,
        reviewer_id: reviewerId,
        status: 'pending',
        submitter_note: submitterNote,
        parent_request_id: parentRequestId ?? null,
        version,
      },
    })

    return NextResponse.json(
      { id: created.id, message: '审批已提交' },
      { status: 201 },
    )
  } catch (e) {
    console.error('[api/reviews POST]', e)
    const msg = e instanceof Error ? e.message : '创建审批失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
