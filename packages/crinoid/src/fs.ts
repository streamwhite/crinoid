import { copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export interface DirectoryEntry {
  readonly name: string
  readonly path: string
  readonly isDirectory: boolean
  readonly size: number
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, 'utf8')
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, content, 'utf8')
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readText(filePath)) as T
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeText(filePath, JSON.stringify(value, null, 2))
}

export async function listDirectory(directory: string): Promise<readonly DirectoryEntry[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  return Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      const info = await stat(path).catch(() => null)
      return {
        name: entry.name,
        path,
        isDirectory: entry.isDirectory(),
        size: info?.size ?? 0
      }
    })
  )
}

export async function ensureDirectory(directory: string): Promise<void> {
  await mkdir(directory, { recursive: true })
}

export async function copyPath(source: string, destination: string): Promise<void> {
  await mkdir(dirname(destination), { recursive: true })
  await copyFile(source, destination)
}

export async function movePath(source: string, destination: string): Promise<void> {
  await mkdir(dirname(destination), { recursive: true })
  try {
    await rename(source, destination)
  } catch {
    await copyFile(source, destination)
    await rm(source, { recursive: true, force: true })
  }
}

export async function removePath(target: string): Promise<void> {
  await rm(target, { recursive: true, force: true })
}
