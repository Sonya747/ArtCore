import type { TASKS } from './typing'

const mockDelay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

export const MOCK_USER_ID = 'mock-user'

const mkId = (n: number) => {
  const hex = (n + 1).toString(16).padStart(12, '0')
  return `00000000-0000-0000-0000-${hex}`
}

const statusLabelOrder: TASKS.GenerationTaskStatus[] = ['pending', 'running', 'success', 'failed']

const buildMockTasks = (): TASKS.GenerationTask[] => {
  const baseCreated = Date.now() - 1000 * 60 * 60 * 24 * 3 // 3 days ago

  return Array.from({ length: 18 }).map((_, idx) => {
    const status: TASKS.GenerationTaskStatus = statusLabelOrder[idx % statusLabelOrder.length]
    const created_at = new Date(baseCreated + idx * 1000 * 60 * 27).toISOString()

    const startedAt =
      status === 'running' || status === 'success' || status === 'failed'
        ? new Date(Date.parse(created_at) + 1000 * 60 * 5 + idx * 1000 * 7).toISOString()
        : null

    const finishedAt =
      status === 'success' || status === 'failed'
        ? new Date(Date.parse(created_at) + 1000 * 60 * 9 + idx * 1000 * 11).toISOString()
        : null

    const error_message =
      status === 'failed'
        ? idx % 2 === 0
          ? 'workflow failed: model server timeout'
          : 'comfyui error: unexpected node output'
        : null

    const model_label = ['Midjourney', 'Doubao', 'Kling', 'Midjourney V6'][idx % 4]
    const workflow_name = ['image-generate', 'image-edit', 'video-generate', 'chatgpt-style'][idx % 4]

    return {
      id: mkId(idx),
      user_id: MOCK_USER_ID,
      input_params: {
        prompt: `mock prompt #${idx + 1}`,
        width: 1024,
        height: 1024,
        seed: 1000 + idx,
        steps: 30,
      },
      model_label,
      workflow_name,
      status,
      error_message,
      created_at,
      started_at: startedAt,
      finished_at: finishedAt,
    }
  })
}

let mockTasks: TASKS.GenerationTask[] = buildMockTasks()

export const tasksService = {
  async listGenerationTasks(
    params: TASKS.ListGenerationTasksParams
  ): Promise<TASKS.ListGenerationTasksResponse> {
    await mockDelay()

    const page = params.page ?? 1
    const page_size = params.page_size ?? 20
    const start = (page - 1) * page_size

    // 演示：仅按 user_id 过滤
    const filtered = mockTasks.filter((t) => t.user_id === params.user_id)
    const slice = filtered.slice(start, start + page_size)

    return {
      page,
      page_size,
      total_count: filtered.length,
      results: slice,
    }
  },

  async deleteGenerationTasks(
    params: TASKS.DeleteGenerationTasksParams
  ): Promise<TASKS.DeleteGenerationTasksResponse> {
    await mockDelay(250)
    const before = mockTasks.length
    const idSet = new Set(params.ids)
    mockTasks = mockTasks.filter((t) => !idSet.has(t.id))

    const deletedCount = before - mockTasks.length
    return { message: deletedCount > 0 ? `已删除 ${deletedCount} 条任务` : '没有可删除的任务' }
  },
}

