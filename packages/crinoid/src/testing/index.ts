export {
  createDeferred,
  createTempDir,
  waitFor,
  withTempDir
} from './fixtures.js'
export type { Deferred, WaitForOptions } from './fixtures.js'

export {
  createFakeIpcMain,
  createFakeIpcPair,
  createIpcEvent,
  TRUSTED_RENDERER_URL,
  UNTRUSTED_RENDERER_URL
} from './ipc.js'
export type {
  FakeIpcEvent,
  FakeIpcHandler,
  FakeIpcListener,
  FakeIpcMain,
  FakeIpcPair,
  FakeIpcPairOptions,
  FakeIpcRenderer
} from './ipc.js'

export { createCollectingLogger } from './logger.js'
export type { CollectingLogger } from './logger.js'

export {
  createBrowserWindowConstructor,
  createElectronMock,
  createMainDeps,
  createMockDialog
} from './electron.js'
export type {
  ElectronMock,
  MainDepsOverrides,
  MockBrowserWindowConstructor,
  MockClipboard,
  MockDialog,
  MockMenu,
  MockNotificationConstructor,
  MockShell,
  MockTrayConstructor,
  MockWebContents,
  MockWindow
} from './electron.js'

export { closeApplication, openFirstWindow, waitForWindow, waitForWindowTitle } from './e2e.js'
export type { E2eApplication, E2eWindow, WaitForWindowOptions } from './e2e.js'
