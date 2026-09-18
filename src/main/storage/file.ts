import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Storage } from './types'

export function createFileStorage<T>(filePath: string): Storage<T> {
  async function read(): Promise<Record<string, T>> { try { return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, T> } catch { return {} } }
  async function write(values: Record<string, T>): Promise<void> { await mkdir(dirname(filePath), { recursive: true }); await writeFile(filePath, JSON.stringify(values, null, 2), 'utf8') }
  return { get: async (key) => (await read())[key] ?? null, set: async (key, value) => { const values = await read(); values[key] = value; await write(values) }, remove: async (key) => { const values = await read(); delete values[key]; await write(values) } }
}

export async function removeStorage(filePath: string): Promise<void> { await rm(filePath, { force: true }) }
