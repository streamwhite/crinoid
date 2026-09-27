export { createTaskContext, TaskCancelledError } from './tasks/task.js'
export type { TaskContext, TaskContextOptions, TaskRunOptions, TaskStatus } from './tasks/task.js'

export { createJobQueue } from './tasks/queue.js'
export type { JobOptions, JobQueue, JobQueueOptions } from './tasks/queue.js'

export { createScheduler, nextCronRun } from './tasks/scheduler.js'
export type { ScheduleSpec, Scheduler, SchedulerOptions } from './tasks/scheduler.js'

export { createWorkerPool } from './tasks/worker.js'
export type { WorkerFactoryResult, WorkerHandle, WorkerPool, WorkerPoolOptions } from './tasks/worker.js'

export { compareVersions, isNewerVersion, isPrerelease, parseVersion } from './tasks/version.js'
export type { ParsedVersion } from './tasks/version.js'

export { DEFAULT_CHANNELS, resolveChannel } from './tasks/release-channel.js'
export type { ReleaseChannel } from './tasks/release-channel.js'

export { createUpdateService } from './tasks/update.js'
export type {
  UpdateAdapter,
  UpdateCheckResult,
  UpdateInfo,
  UpdateService,
  UpdateServiceOptions
} from './tasks/update.js'
