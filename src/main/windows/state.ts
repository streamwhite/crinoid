import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

export interface WindowState { width: number; height: number; x?: number; y?: number; isMaximized: boolean }
const DEFAULT_STATE: WindowState = { width: 1200, height: 800, isMaximized: false }

export async function loadWindowState(filePath: string): Promise<WindowState> {
  try { const value = JSON.parse(await readFile(filePath, 'utf8')) as Partial<WindowState>; return { ...DEFAULT_STATE, ...value } } catch { return DEFAULT_STATE }
}

export async function saveWindowState(filePath: string, state: WindowState): Promise<void> { await mkdir(dirname(filePath), { recursive: true }); await writeFile(filePath, JSON.stringify(state, null, 2), 'utf8') }
