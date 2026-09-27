export interface FileLike {
  readonly name: string
  readonly path?: string | undefined
}

export interface DataTransferLike {
  readonly files?: ArrayLike<FileLike> | undefined
  getData?(type: string): string
}

export interface DroppedItem {
  readonly name: string
  readonly path: string | null
}

export interface DropEventLike {
  preventDefault(): void
  readonly dataTransfer: DataTransferLike | null
}

export interface DropControllerOptions {
  readonly preventDefault?: boolean | undefined
}

export interface DropController {
  onDragOver(event: DropEventLike): void
  onDrop(event: DropEventLike, listener: (items: readonly DroppedItem[]) => void): readonly DroppedItem[]
}

export function readDroppedItems(dataTransfer: DataTransferLike | null): readonly DroppedItem[] {
  if (!dataTransfer?.files) return []
  return Array.from(dataTransfer.files).map((file) => ({
    name: file.name,
    path: typeof file.path === 'string' ? file.path : null
  }))
}

export function hasDroppedFiles(dataTransfer: DataTransferLike | null): boolean {
  return (dataTransfer?.files?.length ?? 0) > 0
}

export function readDroppedText(dataTransfer: DataTransferLike | null): string {
  return dataTransfer?.getData?.('text/plain') ?? ''
}

export function createDropController(options: DropControllerOptions = {}): DropController {
  const preventDefault = options.preventDefault ?? true

  return {
    onDragOver: (event) => {
      if (preventDefault) event.preventDefault()
    },
    onDrop: (event, listener) => {
      if (preventDefault) event.preventDefault()
      const items = readDroppedItems(event.dataTransfer)
      listener(items)
      return items
    }
  }
}
