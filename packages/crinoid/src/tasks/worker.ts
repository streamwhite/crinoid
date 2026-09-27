export interface WorkerHandle {
  postMessage(message: unknown): void
  terminate(): void
}

export interface WorkerFactoryResult {
  readonly worker: WorkerHandle
  onMessage(listener: (message: unknown) => void): void
}

export interface WorkerPoolOptions<TIn, TOut> {
  readonly size: number
  readonly createWorker: (index: number) => WorkerFactoryResult
  readonly onError?: ((error: unknown) => void) | undefined
}

export interface WorkerPool<TIn, TOut> {
  run(input: TIn): Promise<TOut>
  dispose(): void
}

interface PendingTask<TIn, TOut> {
  readonly id: number
  readonly input: TIn
  readonly resolve: (value: TOut) => void
  readonly reject: (error: unknown) => void
}

interface Slot<TIn, TOut> {
  readonly worker: WorkerHandle
  pending: PendingTask<TIn, TOut> | null
  onRelease: () => void
}

export function createWorkerPool<TIn, TOut>(options: WorkerPoolOptions<TIn, TOut>): WorkerPool<TIn, TOut> {
  const idle: Array<Slot<TIn, TOut>> = []
  const slots: Array<Slot<TIn, TOut>> = []
  const waiting: Array<(slot: Slot<TIn, TOut>) => void> = []
  let taskSequence = 0

  const release = (slot: Slot<TIn, TOut>): void => {
    slot.pending = null
    const next = waiting.shift()
    if (next) next(slot)
    else idle.push(slot)
  }

  for (let index = 0; index < Math.max(options.size, 1); index += 1) {
    const factory = options.createWorker(index)
    const slot: Slot<TIn, TOut> = { worker: factory.worker, pending: null, onRelease: () => {} }
    factory.onMessage((message) => {
      const response = message as { id: number; result?: TOut; error?: string }
      const task = slot.pending
      if (!task || response.id !== task.id) return
      if (response.error) task.reject(new Error(response.error))
      else task.resolve(response.result as TOut)
      release(slot)
    })
    slot.onRelease = () => release(slot)
    slots.push(slot)
    idle.push(slot)
  }

  return {
    run: (input) =>
      new Promise<TOut>((resolve, reject) => {
        const id = ++taskSequence
        const task: PendingTask<TIn, TOut> = { id, input, resolve, reject }
        const start = (slot: Slot<TIn, TOut>): void => {
          slot.pending = task
          slot.worker.postMessage({ id, payload: input })
        }
        const available = idle.pop()
        if (available) start(available)
        else waiting.push(start)
      }),
    dispose: () => {
      for (const slot of slots) slot.worker.terminate()
      idle.length = 0
      waiting.length = 0
    }
  }
}
