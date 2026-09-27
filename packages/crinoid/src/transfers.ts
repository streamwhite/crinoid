export type TransferDirection = 'download' | 'upload'
export type TransferState = 'pending' | 'progressing' | 'completed' | 'cancelled' | 'interrupted'

export interface TransferProgress {
  readonly direction: TransferDirection
  readonly filename: string
  readonly url: string
  readonly receivedBytes: number
  readonly totalBytes: number
  readonly progress: number
  readonly state?: TransferState
}

export interface DownloadItemLike {
  getFilename(): string
  getURL(): string
  getTotalBytes(): number
  getReceivedBytes(): number
  setSavePath(path: string): void
  cancel(): void
  on(event: string, listener: (...args: unknown[]) => void): void
}

export interface DownloadSessionLike {
  on(event: 'will-download', listener: (event: unknown, item: DownloadItemLike) => void): void
  downloadURL(url: string): void
}

export interface TransferManagerOptions {
  readonly session: DownloadSessionLike
  readonly onProgress?: (progress: TransferProgress) => void
  readonly onDone?: (progress: TransferProgress) => void
  readonly onError?: (error: unknown) => void
}

export interface UploadHandle {
  start(): void
  progress(receivedBytes: number, totalBytes: number): void
  complete(): void
  cancel(): void
}

export interface TransferManager {
  download(url: string, options?: { savePath?: string }): void
  createUpload(url: string, filename?: string): UploadHandle
  cancelAll(): void
  activeCount(): number
}

export function createTransferManager(options: TransferManagerOptions): TransferManager {
  const items = new Map<DownloadItemLike, TransferProgress>()
  const uploads = new Set<UploadHandle>()
  const pendingSavePaths: string[] = []

  const track = (item: DownloadItemLike): void => {
    const savePath = pendingSavePaths.shift()
    if (savePath) item.setSavePath(savePath)
    const initial = progressFrom(item, 'pending')
    items.set(item, initial)
    const report = (state?: TransferState): void => {
      const current = { ...progressFrom(item, state ?? items.get(item)?.state ?? 'progressing') }
      items.set(item, current)
      options.onProgress?.(current)
    }
    item.on('updated', () => report('progressing'))
    item.on('done', (...args: unknown[]) => {
      const state = args[1]
      const finalState: TransferState =
        state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted'
      const finished = { ...progressFrom(item, finalState), state: finalState }
      items.delete(item)
      options.onProgress?.(finished)
      options.onDone?.(finished)
    })
  }

  options.session.on('will-download', (_event, item) => track(item))

  return {
    download: (url, downloadOptions = {}) => {
      if (downloadOptions.savePath) pendingSavePaths.push(downloadOptions.savePath)
      options.session.downloadURL(url)
    },
    createUpload: (url, filename = 'upload') => {
      let handle: UploadHandle
      handle = {
        start: () => uploads.add(handle),
        progress: (receivedBytes, totalBytes) =>
          options.onProgress?.(buildProgress('upload', filename, url, receivedBytes, totalBytes)),
        complete: () => {
          uploads.delete(handle)
          options.onDone?.(buildProgress('upload', filename, url, 1, 1, 'completed'))
        },
        cancel: () => {
          uploads.delete(handle)
        }
      }
      return handle
    },
    cancelAll: () => {
      for (const item of items.keys()) item.cancel()
      items.clear()
      for (const upload of uploads) upload.cancel()
      uploads.clear()
    },
    activeCount: () => items.size + uploads.size
  }
}

function progressFrom(item: DownloadItemLike, state: TransferState): TransferProgress {
  return {
    ...buildProgress('download', item.getFilename(), item.getURL(), item.getReceivedBytes(), item.getTotalBytes()),
    state
  }
}

function buildProgress(
  direction: TransferDirection,
  filename: string,
  url: string,
  receivedBytes: number,
  totalBytes: number,
  state?: TransferState
): TransferProgress {
  return {
    direction,
    filename,
    url,
    receivedBytes,
    totalBytes,
    progress: totalBytes > 0 ? receivedBytes / totalBytes : 0,
    ...(state === undefined ? {} : { state })
  }
}
