import { safeStorage } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export async function writeSecret(filePath: string, value: string): Promise<void> {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('OS secret storage is unavailable')
  await mkdir(dirname(filePath), { recursive: true }); await writeFile(filePath, safeStorage.encryptString(value))
}

export async function readSecret(filePath: string): Promise<string | null> {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('OS secret storage is unavailable')
  try { return safeStorage.decryptString(await readFile(filePath)) } catch { return null }
}
