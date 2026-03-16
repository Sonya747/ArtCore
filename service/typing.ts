export enum TaskType {
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    CHAT = 'dialog_image',
  }
  
  export enum TaskStatus {
    PROCESSING = 'Processing', // 处理中
    FAILED = 'Failed', // 失败
    FINISHED = 'Finished', // 已完成
    SUBMITTED = 'Submitted', // 已提交
    PENDING = 'Pending', // 排队中
  }
  