export interface NativeDialogResult {
  readonly canceled: boolean
  readonly filePaths: readonly string[]
}

export interface NativeSaveResult {
  readonly canceled: boolean
  readonly filePath?: string | undefined
}

export interface MessageBoxResult {
  readonly response: number
}

export interface DialogPort {
  showOpenDialog(window: unknown, options: unknown): Promise<NativeDialogResult>
  showSaveDialog(window: unknown, options: unknown): Promise<NativeSaveResult>
  showMessageBox(window: unknown, options: unknown): Promise<MessageBoxResult>
}

export interface FileFilter {
  readonly name: string
  readonly extensions: readonly string[]
}

export interface OpenDialogOptions {
  readonly title?: string
  readonly defaultPath?: string
  readonly buttonLabel?: string
  readonly filters?: readonly FileFilter[]
}

export interface SaveDialogOptions extends OpenDialogOptions {}

export interface SaveDialogRequest {
  readonly defaultPath?: string
}

export interface ConfirmDialogOptions {
  readonly message: string
  readonly detail?: string
  readonly confirmLabel: string
  readonly cancelLabel: string
  readonly type?: 'none' | 'info' | 'error' | 'question' | 'warning'
}

const CONFIRM_TYPES = ['none', 'info', 'error', 'question', 'warning'] as const

export function isSaveDialogRequest(value: unknown): value is SaveDialogRequest {
  if (!isRecord(value)) return false
  return value.defaultPath === undefined || typeof value.defaultPath === 'string'
}

export function isConfirmDialogOptions(value: unknown): value is ConfirmDialogOptions {
  if (!isRecord(value)) return false
  const type = value.type
  return (
    typeof value.message === 'string' &&
    (value.detail === undefined || typeof value.detail === 'string') &&
    typeof value.confirmLabel === 'string' &&
    typeof value.cancelLabel === 'string' &&
    (type === undefined || (CONFIRM_TYPES as readonly unknown[]).includes(type))
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export interface DialogService {
  openFile(options?: OpenDialogOptions): Promise<string | null>
  openFiles(options?: OpenDialogOptions): Promise<readonly string[]>
  openDirectory(options?: OpenDialogOptions): Promise<string | null>
  saveFile(options?: SaveDialogOptions): Promise<string | null>
  confirm(options: ConfirmDialogOptions): Promise<boolean>
}

export interface DialogServiceOptions {
  readonly dialog: DialogPort
  readonly resolveWindow?: (() => unknown | undefined) | undefined
}

export function createDialogService(options: DialogServiceOptions): DialogService {
  const { dialog, resolveWindow } = options
  const parent = (): unknown => resolveWindow?.()

  return {
    openFile: async (openOptions) => first((await dialog.showOpenDialog(parent(), { properties: ['openFile'], ...openOptions })).filePaths),
    openFiles: async (openOptions) =>
      (await dialog.showOpenDialog(parent(), { properties: ['openFile', 'multiSelections'], ...openOptions })).filePaths,
    openDirectory: async (openOptions) =>
      first((await dialog.showOpenDialog(parent(), { properties: ['openDirectory'], ...openOptions })).filePaths),
    saveFile: async (saveOptions) => {
      const result = await dialog.showSaveDialog(parent(), { ...saveOptions })
      return result.canceled ? null : result.filePath ?? null
    },
    confirm: async (confirmOptions) => {
      const result = await dialog.showMessageBox(parent(), {
        type: confirmOptions.type ?? 'question',
        message: confirmOptions.message,
        buttons: [confirmOptions.confirmLabel, confirmOptions.cancelLabel],
        defaultId: 0,
        cancelId: 1,
        ...(confirmOptions.detail === undefined ? {} : { detail: confirmOptions.detail })
      })
      return result.response === 0
    }
  }
}

function first(filePaths: readonly string[]): string | null {
  return filePaths[0] ?? null
}
