import { NextResponse } from 'next/server'
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

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { id } = await ctx.params
    const prisma = getAssetsPrisma()

    const current = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        submitter: true,
        reviewer: true,
        task: {
          include: {
            generated_images: { orderBy: { sort_order: 'asc' } },
          },
        },
      },
    })

    if (!current) {
      return NextResponse.json({ error: '审批不存在' }, { status: 404 })
    }

    if (current.submitter_id !== auth.userId && current.reviewer_id !== auth.userId) {
      return NextResponse.json({ error: '无权查看该审批' }, { status: 403 })
    }

    // Walk the version chain (parents + self)
    const chain: typeof current[] = []
    let cursor: typeof current | null = current
    const seen = new Set<string>()
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id)
      chain.unshift(cursor)
      if (!cursor.parent_request_id) break
      cursor = await prisma.approvalRequest.findUnique({
        where: { id: cursor.parent_request_id },
        include: {
          submitter: true,
          reviewer: true,
          task: {
            include: { generated_images: { orderBy: { sort_order: 'asc' } } },
          },
        },
      })
    }

    // Build linear timeline across versions
    const history = chain.flatMap((r) => {
      const entries: Array<{
        type: 'submit' | 'review'
        version: number
        request_id: string
        actor: ReturnType<typeof mapUser>
        note: string | null
        status: ReviewStatus | null
        at: string
      }> = [
        {
          type: 'submit',
          version: r.version,
          request_id: r.id,
          actor: mapUser(r.submitter),
          note: r.submitter_note,
          status: null,
          at: r.created_at.toISOString(),
        },
      ]
      if (r.reviewed_at && r.reviewer) {
        entries.push({
          type: 'review',
          version: r.version,
          request_id: r.id,
          actor: mapUser(r.reviewer),
          note: r.reviewer_note,
          status: r.status as ReviewStatus,
          at: r.reviewed_at.toISOString(),
        })
      }
      return entries
    })

    const review = {
      id: current.id,
      task: {
        id: current.task.id,
        raw_prompt: current.task.raw_prompt,
        final_prompt: current.task.final_prompt,
        model_name: current.task.model_name,
        image_size: current.task.image_size,
        request_params: current.task.request_params as Record<string, unknown> | null,
        thumbnail_url: current.task.generated_images[0]?.image_url ?? null,
      },
      submitter: mapUser(current.submitter),
      reviewer: current.reviewer ? mapUser(current.reviewer) : null,
      status: current.status as ReviewStatus,
      submitter_note: current.submitter_note,
      reviewer_note: current.reviewer_note,
      parent_request_id: current.parent_request_id,
      version: current.version,
      created_at: current.created_at.toISOString(),
      reviewed_at: current.reviewed_at?.toISOString() ?? null,
      task_images: current.task.generated_images.map((img) => ({
        id: img.id,
        image_url: img.image_url,
        sort_order: img.sort_order,
      })),
      history,
    }

    return NextResponse.json({ review })
  } catch (e) {
    console.error('[api/reviews/:id GET]', e)
    const msg = e instanceof Error ? e.message : '查询审批详情失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
