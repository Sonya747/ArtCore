import type { TASKS } from './typing'

const requestJson = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const res = await fetch(input, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : res.statusText || '请求失败')
  }
  return data as T
}

export const tasksService = {
  async listGenerationTasks(
    params: TASKS.ListGenerationTasksParams,
  ): Promise<TASKS.ListGenerationTasksResponse> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      page_size: String(params.page_size ?? 20),
      ...(params.status ? { status: params.status } : {}),
    })
    return requestJson<TASKS.ListGenerationTasksResponse>(`/api/tasks?${query}`)
  },

  async createGenerationTask(
    params: TASKS.CreateGenerationTaskParams,
  ): Promise<TASKS.CreateGenerationTaskResponse> {
    return requestJson<TASKS.CreateGenerationTaskResponse>('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  },

  async deleteGenerationTasks(
    params: TASKS.DeleteGenerationTasksParams,
  ): Promise<TASKS.DeleteGenerationTasksResponse> {
    return requestJson<TASKS.DeleteGenerationTasksResponse>('/api/tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: params.ids }),
    })
  },
}
