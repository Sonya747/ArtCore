import { NextResponse } from 'next/server'
import { getAssetsPrisma } from '@/lib/prisma-assets-db'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { id } = await ctx.params
    const prisma = getAssetsPrisma()
    const body = await req.json()
    const action = body.action as 'approve' | 'reject'
    const reviewerNote: string = (body.reviewer_note ?? '').trim()

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: '未知动作' }, { status: 400 })
    }

    const current = await prisma.approvalRequest.findUnique({ where: { id } })
    if (!current) {
      return NextResponse.json({ error: '审批不存在' }, { status: 404 })
    }

    if (current.reviewer_id !== auth.userId) {
      return NextResponse.json({ error: '只能操作分配给自己的审批' }, { status: 403 })
    }

    if (current.status !== 'pending') {
      return NextResponse.json({ error: '该审批已处理' }, { status: 400 })
    }

    if (action === 'reject' && !reviewerNote) {
      return NextResponse.json(
        { error: '驳回时必须填写批注，说明具体修改意见' },
        { status: 400 },
      )
    }

    await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewer_note: reviewerNote || null,
        reviewed_at: new Date(),
      },
    })

    return NextResponse.json({
      message: action === 'approve' ? '已通过' : '已驳回',
    })
  } catch (e) {
    console.error('[api/reviews/:id/action POST]', e)
    const msg = e instanceof Error ? e.message : '操作失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
