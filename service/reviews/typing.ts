export namespace REVIEWS {
  export type ReviewStatus = 'pending' | 'approved' | 'rejected'
  export type ReviewTab = 'mine' | 'inbox'
  export type ReviewAction = 'approve' | 'reject'

  export interface ReviewUser {
    id: string
    name: string
    username: string
    role: string
  }

  export interface ReviewTaskBrief {
    id: string
    raw_prompt: string
    final_prompt: string | null
    model_name: string | null
    image_size: string | null
    request_params: Record<string, unknown> | null
    image_url: string | null
    thumbnail_url: string | null
  }

  export interface ReviewItem {
    id: string
    task: ReviewTaskBrief
    submitter: ReviewUser
    reviewer: ReviewUser | null
    status: ReviewStatus
    submitter_note: string | null
    reviewer_note: string | null
    parent_request_id: string | null
    version: number
    created_at: string
    reviewed_at: string | null
  }

  export interface ListReviewsParams {
    tab: ReviewTab
    /** inbox 下 `finished` 表示已通过或已驳回（我作为审核人已办结） */
    status?: ReviewStatus | 'all' | 'finished'
    keyword?: string
    page?: number
    page_size?: number
  }

  export interface ReviewSummary {
    /** 待我审批 + 我提交且待审核 */
    my_todo: number
    pending_as_reviewer: number
    pending_as_submitter: number
    /** 我作为审核人已办结（通过或驳回） */
    my_done_as_reviewer: number
    /** 我作为提交人被驳回 */
    my_rejected_as_submitter: number
  }

  export interface ListReviewsResponse {
    page: number
    page_size: number
    total_count: number
    pending_inbox_count: number
    summary: ReviewSummary
    results: ReviewItem[]
  }

  export interface TaskImage {
    id: string
    image_url: string
    sort_order: number
  }

  export interface HistoryEntry {
    type: 'submit' | 'review'
    version: number
    request_id: string
    actor: ReviewUser
    note: string | null
    status: ReviewStatus | null
    at: string
  }

  export interface ReviewDetail extends ReviewItem {
    task_images: TaskImage[]
    history: HistoryEntry[]
  }

  export interface ReviewDetailResponse {
    review: ReviewDetail
  }

  export interface CreateReviewParams {
    task_id: string
    reviewer_id: string
    submitter_note?: string
    parent_request_id?: string | null
  }

  export interface CreateReviewResponse {
    id: string
    message: string
  }

  export interface ActReviewParams {
    id: string
    action: ReviewAction
    reviewer_note: string
  }

  export interface ActReviewResponse {
    message: string
  }

  export interface ReviewableTask extends ReviewTaskBrief {
    created_at: string
    status: string
  }

  export interface ListReviewableTasksResponse {
    results: ReviewableTask[]
  }

  export interface ListReviewersResponse {
    results: ReviewUser[]
  }
}
