export {
  ApiError,
  createApiClient,
  createApiError,
  getErrorMessage
} from './api.js'
export type { ApiClient, ApiClientOptions } from './api.js'

export { createDesktopConfig, DEFAULT_FEATURES } from './config.js'
export type { AppConfig, DesktopConfig, FeatureFlags } from './config.js'

export { APP_ENVIRONMENTS, environmentFromProcess, isAppEnvironment, readEnvValue, resolveEnvironment } from './environment.js'
export type { AppEnvironment, EnvironmentInfo, EnvironmentSource } from './environment.js'

export {
  DEFAULT_SHUTDOWN_TIMEOUT_MS,
  createShutdownManager,
  withTimeout
} from './shutdown.js'
export type { ShutdownManager, ShutdownReport, ShutdownTask } from './shutdown.js'

export { createAppLifecycle } from './lifecycle.js'
export type { AppEventTarget, Lifecycle, LifecycleOptions } from './lifecycle.js'

export { installGlobalErrorHandlers, normalizeError } from './errors.js'
export type { ErrorEventSource, ErrorScope, GlobalErrorHandlersOptions } from './errors.js'

export {
  LOG_LEVELS,
  createConsoleSink,
  createLogger,
  createMultiSink,
  createRotatingFileSink,
  levelFromEnvironment,
  logger
} from './logging.js'
export type { ConsoleLike, LogLevel, LogRecord, LogSink, Logger, LoggerOptions, RotatingFileSinkOptions } from './logging.js'

export { createCrashReporter, scrubContext } from './crash-reporting.js'
export type { CrashReport, CrashReporter, CrashReporterOptions } from './crash-reporting.js'

export { createMetrics } from './metrics.js'
export type { MetricRecord, MetricSummary, Metrics, MetricsOptions } from './metrics.js'

export { createTracer } from './trace.js'
export type { Span, SpanStatus, Tracer, TracerOptions } from './trace.js'

export { buildFeedbackReport, isFeedbackReport } from './feedback.js'
export type { FeedbackCategory, FeedbackInput, FeedbackReport } from './feedback.js'

export {
  RTL_LOCALES,
  createFormatters,
  detectLocale,
  directionForLocale,
  normalizeLocale,
  resolveLocale
} from './i18n.js'
export type {
  Formatters,
  FormattersOptions,
  LocaleDetectionInput,
  ResolvedLocale,
  TextDirection
} from './i18n.js'

export { createObservability } from './observability.js'
export type { FeedbackSubmission, Observability, ObservabilityOptions } from './observability.js'

export { fuzzyScore, rankBy } from './search.js'
export type { RankOptions } from './search.js'

export { createCommandRegistry } from './command-palette.js'
export type { Command, CommandRegistry } from './command-palette.js'

export { createFavorites } from './favorites.js'
export type { FavoriteEntry, FavoriteItem, Favorites, FavoritesOptions } from './favorites.js'

export { createHistory } from './history.js'
export type { History, HistoryOptions, HistoryState } from './history.js'

export { createSettings } from './settings.js'
export type { Settings, SettingsOptions } from './settings.js'

export { createAboutInfo, formatAboutText } from './about.js'
export type { AboutInfo, AboutOptions } from './about.js'

export { createHelpService } from './help.js'
export type { HelpService, HelpServiceOptions } from './help.js'

export { createKeybindingRegistry, formatKeybinding, matchesKeybinding, parseKeybinding, platformName } from './keybindings.js'
export type { KeyEventLike, KeybindingParts, KeybindingRegistry } from './keybindings.js'

export { createDropController, hasDroppedFiles, readDroppedItems, readDroppedText } from './drag-drop.js'
export type { DataTransferLike, DropController, DropControllerOptions, DropEventLike, DroppedItem, FileLike } from './drag-drop.js'

export { createModuleRuntime } from './module.js'
export type { CapabilityContext, ModuleRuntime, RuntimeModule } from './module.js'

export { DESKTOP_CHANNELS, IPC_CHANNELS, createChannel, createIpcInvoker, createIpcRegistry } from './ipc.js'
export type {
  CrashReportRequest,
  DesktopAPI,
  FeedbackRequest,
  IpcChannel,
  IpcChannelName,
  IpcHandlerContext,
  IpcMainLike,
  IpcRegistration,
  IpcRegistry,
  IpcRegistryOptions,
  IpcRendererLike
} from './ipc.js'

export { createFileStorage, createMemoryStorage, removeStorage } from './storage.js'
export type { Storage } from './storage.js'

export {
  DEFAULT_WINDOW_STATE,
  createWindowRegistry,
  ensureVisibleOnDisplays,
  loadWindowState,
  saveWindowState
} from './window.js'
export type {
  DisplayWorkArea,
  ManagedWindow,
  WindowBounds,
  WindowChromeOptions,
  WindowLike,
  WindowRegistry,
  WindowState,
  WindowWebContents
} from './window.js'

export { createDialogService, isConfirmDialogOptions, isSaveDialogRequest } from './dialogs.js'
export type {
  ConfirmDialogOptions,
  DialogPort,
  DialogService,
  DialogServiceOptions,
  FileFilter,
  MessageBoxResult,
  NativeDialogResult,
  NativeSaveResult,
  OpenDialogOptions,
  SaveDialogOptions,
  SaveDialogRequest
} from './dialogs.js'

export { createShortcutManager } from './shortcuts.js'
export type { GlobalShortcutPort, ShortcutAction, ShortcutManager } from './shortcuts.js'

export { createTrayController } from './tray.js'
export type { TrayController, TrayControllerOptions, TrayLabels, TrayMenuBuilder, TrayPort, TrayWindow } from './tray.js'

export { createMenuService, defaultApplicationMenuTemplate } from './menu.js'
export type { BuiltMenu, ContextMenuPosition, MenuItemTemplate, MenuPort, MenuService } from './menu.js'

export { createContextMenuHandler, isContextMenuRequest } from './context-menu.js'
export type {
  BuiltContextMenu,
  ContextMenuHandler,
  ContextMenuHandlerOptions,
  ContextMenuItem,
  ContextMenuPort,
  ContextMenuRequest
} from './context-menu.js'

export { createPlatformIntegration } from './integration.js'
export type { BadgeAppPort, DockPort, PlatformIntegration, PlatformIntegrationOptions, TaskbarPort, TaskbarProgressOptions } from './integration.js'

export { createStore } from './reactive.js'
export type { Listener, ReadableStore, Store } from './reactive.js'

export { createPersistentStore } from './persistent.js'
export type { PersistentStore, PersistentStoreOptions } from './persistent.js'

export { createStateSync } from './state-sync.js'
export type { StateListener, StateSync, StateSyncOptions, SyncRegistry, SyncWindow } from './state-sync.js'

export { createPreferences } from './preferences.js'
export type { PreferenceListener, Preferences, PreferencesOptions } from './preferences.js'

export { createRecentItems } from './recent-items.js'
export type { RecentEntry, RecentItem, RecentItems, RecentItemsOptions } from './recent-items.js'

export {
  basename,
  dirname,
  ensureExtension,
  extension,
  isAbsolutePath,
  isSubPath,
  joinPath,
  normalizePath,
  relativePath,
  resolvePath,
  uniquePath
} from './paths.js'

export { DEFAULT_MIME_TYPE, detectMimeType, getFileCategory, isTextMimeType } from './mime.js'
export type { FileCategory } from './mime.js'

export {
  copyPath,
  ensureDirectory,
  fileExists,
  listDirectory,
  movePath,
  readJson,
  readText,
  removePath,
  writeJson,
  writeText
} from './fs.js'
export type { DirectoryEntry } from './fs.js'

export { readTextStream, writeTextStream } from './stream.js'
export type { StreamProgress } from './stream.js'

export { createNodeWatcher, watchPath } from './watch.js'
export type { WatchChangeType, WatchEvent, WatchFactory, WatchListener, WatchOptions, Watcher } from './watch.js'

export { createClipboardService, HTML_MIME_TYPE, IMAGE_MIME_TYPE } from './clipboard.js'
export type { ClipboardPort, ClipboardService } from './clipboard.js'

export { createNotificationService } from './notifications.js'
export type {
  NotificationConstructor,
  NotificationHandlers,
  NotificationInstance,
  NotificationOptions,
  NotificationPort,
  NotificationService
} from './notifications.js'

export { createShellService } from './shell.js'
export type { ShellPort, ShellService } from './shell.js'

export { collectSystemInfo, formatBytes } from './system.js'
export type { CpuCore, SystemInfo, SystemPort } from './system.js'

export { createPowerMonitor, readBatteryStatus } from './power.js'
export type { BatteryStatus, PowerEventSource, PowerHandlers, PowerMonitor, PowerStatusPort } from './power.js'

export { createBrowserNetworkMonitor, createNetworkMonitor, isBrowserOnline, readNetworkStatus } from './network.js'
export type {
  BrowserNetworkGlobal,
  NetworkEventSubscription,
  NetworkMonitor,
  NetworkMonitorOptions,
  NetworkStatus,
  NetworkStatusPort
} from './network.js'

export { createSecretStore } from './secrets.js'
export type { SecretStore, SecretStorePort } from './secrets.js'

export { createWebSocketClient } from './websocket.js'
export type { SocketLike, SocketStatus, WebSocketClient, WebSocketClientOptions } from './websocket.js'

export { createSseClient } from './sse.js'
export type { EventSourceLike, SseClient, SseClientOptions, SseStatus } from './sse.js'

export { createTransferManager } from './transfers.js'
export type {
  DownloadItemLike,
  DownloadSessionLike,
  TransferDirection,
  TransferManager,
  TransferManagerOptions,
  TransferProgress,
  TransferState,
  UploadHandle
} from './transfers.js'

export { applyProxy, resolveProxyConfig } from './proxy.js'
export type { ProxyConfigInput, ProxyMode, ProxySession, ResolvedProxyConfig } from './proxy.js'

export { createTokenManager, isTokenExpired, createSessionManager, createOAuthClient, createPkcePair, parseOAuthCallback } from './auth.js'
export type {
  AuthorizationRequest,
  AuthResult,
  Credentials,
  OAuthCallback,
  OAuthClient,
  OAuthClientOptions,
  OAuthExchangeParams,
  PkcePair,
  Session,
  SessionListener,
  SessionManager,
  SessionManagerOptions,
  TokenListener,
  TokenManager,
  TokenManagerOptions,
  TokenProvider,
  TokenSet
} from './auth.js'

export { createDeepLinkRouter, findDeepLinkArgument, isDeepLink, parseDeepLink, parseDeepLinkPath } from './deep-link.js'
export type { DeepLink, DeepLinkPath, DeepLinkRouter } from './deep-link.js'

export { createSingleInstance } from './single-instance.js'
export type { SingleInstanceApp, SingleInstanceOptions } from './single-instance.js'

export { createAutoLaunch } from './auto-launch.js'
export type { AutoLaunch, AutoLaunchOptions, LoginItemPort, LoginItemSettings } from './auto-launch.js'

export { createCache } from './cache.js'
export type { Cache, CacheOptions } from './cache.js'

export { createKeyValueStorage } from './storage.js'
export type { KeyValueStorage } from './storage.js'

export { createDatabase, createRepository, runMigrations } from './database.js'
export type { Database, DatabaseOptions, Migration, Repository, RepositoryOptions, SqlDriver, SqlParams } from './database.js'

export { createSqliteDriver } from './sqlite.js'
export type { SqliteDriverOptions } from './sqlite.js'

export { createDataTransfer } from './data-transfer.js'
export type { BackupPort, DataSnapshot, DataTransfer, DataTransferOptions, ImportOptions, RestorePort } from './data-transfer.js'

export { createIndexedDbStore } from './indexeddb.js'
export type {
  IdbDatabaseLike,
  IdbFactoryLike,
  IdbObjectStoreLike,
  IdbOpenRequestLike,
  IdbRequestLike,
  IdbTransactionLike,
  IndexedDbStore,
  IndexedDbStoreOptions
} from './indexeddb.js'

export {
  TaskCancelledError,
  compareVersions,
  createJobQueue,
  createScheduler,
  createTaskContext,
  createUpdateService,
  createWorkerPool,
  DEFAULT_CHANNELS,
  isNewerVersion,
  isPrerelease,
  nextCronRun,
  parseVersion,
  resolveChannel
} from './tasks.js'
export type {
  JobOptions,
  JobQueue,
  JobQueueOptions,
  ParsedVersion,
  ReleaseChannel,
  ScheduleSpec,
  Scheduler,
  SchedulerOptions,
  TaskContext,
  TaskContextOptions,
  TaskRunOptions,
  TaskStatus,
  UpdateAdapter,
  UpdateCheckResult,
  UpdateInfo,
  UpdateService,
  UpdateServiceOptions,
  WorkerFactoryResult,
  WorkerHandle,
  WorkerPool,
  WorkerPoolOptions
} from './tasks.js'

export {
  buildContentSecurityPolicy,
  installContentSecurityPolicy,
  isAllowedExternalUrl,
  isPermissionAllowed,
  isTrustedSender
} from './security.js'
export type { ContentSecurityPolicyOptions, HeadersSession } from './security.js'

export type {
  AuthBridge,
  DesktopAutoLaunchOptions,
  DesktopMainDeps,
  DesktopMainOptions,
  DesktopObservabilityOptions,
  DesktopWindowOptions,
  StateOptions,
  TrayOptions
} from './main.js'
