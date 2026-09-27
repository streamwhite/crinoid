export interface E2eWindow {
  title(): Promise<string>
  waitForSelector(selector: string, options?: { state?: string; timeout?: number }): Promise<unknown>
}

export interface E2eApplication {
  firstWindow(): Promise<E2eWindow>
  windows(): E2eWindow[]
  close(): Promise<void>
}

export interface WaitForWindowOptions {
  readonly timeoutMs?: number
  readonly intervalMs?: number
}

const DEFAULT_TIMEOUT_MS = 10000
const DEFAULT_INTERVAL_MS = 100

export async function openFirstWindow(application: E2eApplication): Promise<E2eWindow> {
  return application.firstWindow()
}

export async function waitForWindowTitle(
  window: E2eWindow,
  expected: string,
  options: WaitForWindowOptions = {}
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const deadline = Date.now() + timeoutMs
  while ((await window.title()) !== expected) {
    if (Date.now() >= deadline) throw new Error(`Window title did not become "${expected}" within ${timeoutMs}ms`)
    await delay(options.intervalMs ?? DEFAULT_INTERVAL_MS)
  }
}

export async function waitForWindow(
  application: E2eApplication,
  predicate: (window: E2eWindow) => boolean,
  options: WaitForWindowOptions = {}
): Promise<E2eWindow> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const deadline = Date.now() + timeoutMs
  while (true) {
    const match = application.windows().find(predicate)
    if (match) return match
    if (Date.now() >= deadline) throw new Error(`Matching window did not appear within ${timeoutMs}ms`)
    await delay(options.intervalMs ?? DEFAULT_INTERVAL_MS)
  }
}

export async function closeApplication(application: E2eApplication): Promise<void> {
  await application.close()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
