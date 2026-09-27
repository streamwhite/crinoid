import { createReadStream, createWriteStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createInterface } from 'node:readline'

export interface StreamProgress {
  onProgress?(bytes: number): void
}

export async function writeTextStream(
  filePath: string,
  chunks: Iterable<string> | AsyncIterable<string>,
  options: StreamProgress = {}
): Promise<number> {
  const stream = createWriteStream(filePath, { encoding: 'utf8' })
  let written = 0
  try {
    for await (const chunk of chunks) {
      if (!stream.write(chunk)) await once(stream, 'drain')
      written += Buffer.byteLength(chunk)
      options.onProgress?.(written)
    }
    await new Promise<void>((resolve, reject) => {
      stream.end((error?: Error | null) => (error ? reject(error) : resolve()))
    })
    return written
  } finally {
    stream.destroy()
  }
}

export async function readTextStream(filePath: string, options: StreamProgress = {}): Promise<string> {
  const { size } = await stat(filePath)
  const reader = createInterface({ input: createReadStream(filePath, { encoding: 'utf8' }), crlfDelay: Number.POSITIVE_INFINITY })
  const lines: string[] = []
  let read = 0
  for await (const line of reader) {
    read += Buffer.byteLength(`${line}\n`)
    lines.push(line)
    options.onProgress?.(Math.min(read, size))
  }
  return lines.join('\n')
}

function once(stream: NodeJS.EventEmitter, event: string): Promise<void> {
  return new Promise((resolve) => stream.once(event, resolve))
}
