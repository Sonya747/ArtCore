import { assetsService } from './assets'
import { memberService } from './member'
import { tasksService } from './tasks'
import { TaskType } from './typing'

export const API = {
  assets: assetsService,
  member: memberService,
  tasks: tasksService,
  workspace: {
    async deleteTask(params: { request_id: string; task_type: TaskType; batch_delete_item?: any[] }) {
      console.log('deleteTask called with:', params)
      return Promise.resolve()
    },
  },
}
