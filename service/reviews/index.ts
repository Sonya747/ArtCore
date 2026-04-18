import type { REVIEWS } from './typing'

const requestJson = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const res = await fetch(input, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : res.statusText || '请求失败')
  }
  return data as T
}

export const reviewsService = {
  async listReviews(
    params: REVIEWS.ListReviewsParams,
  ): Promise<REVIEWS.ListReviewsResponse> {
    const query = new URLSearchParams({
      tab: params.tab,
      page: String(params.page ?? 1),
      page_size: String(params.page_size ?? 50),
      ...(params.status && params.status !== 'all'
        ? { status: params.status }
        : {}),
      ...(params.keyword ? { keyword: params.keyword } : {}),
    })
    return requestJson<REVIEWS.ListReviewsResponse>(`/api/reviews?${query}`)
  },

  async getReviewDetail(id: string): Promise<REVIEWS.ReviewDetailResponse> {
    return requestJson<REVIEWS.ReviewDetailResponse>(`/api/reviews/${id}`)
  },

  async createReview(
    params: REVIEWS.CreateReviewParams,
  ): Promise<REVIEWS.CreateReviewResponse> {
    return requestJson<REVIEWS.CreateReviewResponse>('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  },

  async actOnReview(
    params: REVIEWS.ActReviewParams,
  ): Promise<REVIEWS.ActReviewResponse> {
    return requestJson<REVIEWS.ActReviewResponse>(`/api/reviews/${params.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: params.action,
        reviewer_note: params.reviewer_note,
      }),
    })
  },

  async listReviewableTasks(): Promise<REVIEWS.ListReviewableTasksResponse> {
    return requestJson<REVIEWS.ListReviewableTasksResponse>('/api/reviews/reviewable-tasks')
  },

  async listReviewers(): Promise<REVIEWS.ListReviewersResponse> {
    return requestJson<REVIEWS.ListReviewersResponse>('/api/reviews/reviewers')
  },
}
