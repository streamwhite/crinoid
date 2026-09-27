import { basename as nodeBasename, dirname as nodeDirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'

export function joinPath(...segments: string[]): string {
  return join(...segments)
}

export function normalizePath(value: string): string {
  return normalize(value)
}

export function resolvePath(...segments: string[]): string {
  return resolve(...segments)
}

export function basename(value: string): string {
  return nodeBasename(value)
}

export function dirname(value: string): string {
  return nodeDirname(value)
}

export function extension(value: string): string {
  return extname(value)
}

export function isAbsolutePath(value: string): boolean {
  return isAbsolute(value)
}

export function relativePath(from: string, to: string): string {
  return relative(from, to)
}

export function ensureExtension(value: string, extensionWithDot: string): string {
  return extname(value).toLowerCase() === extensionWithDot.toLowerCase() ? value : `${value}${extensionWithDot}`
}

export function isSubPath(parent: string, candidate: string): boolean {
  const base = resolve(parent)
  const target = resolve(candidate)
  if (base === target) return true
  return target.startsWith(base.endsWith(sep) ? base : `${base}${sep}`)
}

export function uniquePath(candidate: string, exists: (value: string) => boolean): string {
  if (!exists(candidate)) return candidate
  const directory = dirname(candidate)
  const name = basename(candidate)
  const ext = extname(name)
  const stem = ext ? name.slice(0, -ext.length) : name
  let index = 1
  while (exists(join(directory, `${stem} (${index})${ext}`))) index += 1
  return join(directory, `${stem} (${index})${ext}`)
}
