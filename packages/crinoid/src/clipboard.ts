export interface ClipboardPort {
  readText(): Promise<string>
  writeText(text: string): Promise<void>
  readImage(): Promise<Uint8Array>
  writeImage(png: Uint8Array): Promise<void>
  has(mimeType: string): Promise<boolean>
  clear(): void
}

export interface ClipboardService {
  readText(): Promise<string>
  writeText(value: string): Promise<void>
  readImage(): Promise<Uint8Array>
  writeImage(png: Uint8Array): Promise<void>
  hasImage(): Promise<boolean>
  hasHtml(): Promise<boolean>
  clear(): void
}

export const IMAGE_MIME_TYPE = 'image/png'
export const HTML_MIME_TYPE = 'text/html'

export function createClipboardService(clipboard: ClipboardPort): ClipboardService {
  return {
    readText: () => clipboard.readText(),
    writeText: (value) => clipboard.writeText(value),
    readImage: () => clipboard.readImage(),
    writeImage: (png) => clipboard.writeImage(png),
    hasImage: () => clipboard.has(IMAGE_MIME_TYPE),
    hasHtml: () => clipboard.has(HTML_MIME_TYPE),
    clear: () => clipboard.clear()
  }
}
