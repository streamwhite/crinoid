import { extname } from 'node:path'

const MIME_BY_EXTENSION: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.json': 'application/json',
  '.jsonc': 'application/json',
  '.xml': 'application/xml',
  '.yaml': 'application/yaml',
  '.yml': 'application/yaml',
  '.toml': 'application/toml',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.cjs': 'text/javascript',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.jsx': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.gz': 'application/gzip',
  '.tar': 'application/x-tar',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime'
}

export const DEFAULT_MIME_TYPE = 'application/octet-stream'

const TEXT_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/css',
  'text/javascript',
  'text/typescript',
  'application/json',
  'application/xml',
  'application/yaml',
  'application/toml'
])

export type FileCategory = 'text' | 'image' | 'media' | 'document' | 'data' | 'archive' | 'other'

export function detectMimeType(fileName: string): string {
  return MIME_BY_EXTENSION[extname(fileName).toLowerCase()] ?? DEFAULT_MIME_TYPE
}

export function isTextMimeType(mimeType: string): boolean {
  return TEXT_MIME_TYPES.has(mimeType) || mimeType.startsWith('text/')
}

const DATA_MIME_TYPES = new Set(['application/json', 'application/xml', 'application/yaml', 'application/toml'])

export function getFileCategory(mimeType: string): FileCategory {
  if (DATA_MIME_TYPES.has(mimeType)) return 'data'
  if (isTextMimeType(mimeType)) return 'text'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) return 'media'
  if (mimeType === 'application/pdf') return 'document'
  if (mimeType.includes('zip') || mimeType.includes('gzip') || mimeType.includes('tar')) return 'archive'
  return 'other'
}
