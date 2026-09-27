export type { AppConfig, DesktopConfig, FeatureFlags } from './config.js'
export type { AppEnvironment, EnvironmentInfo, EnvironmentSource } from './environment.js'
export type { ShutdownManager, ShutdownReport, ShutdownTask } from './shutdown.js'
export type { AppEventTarget, Lifecycle, LifecycleOptions } from './lifecycle.js'
export type { ErrorEventSource, ErrorScope, GlobalErrorHandlersOptions } from './errors.js'
export type { ApiClient, ApiClientOptions } from './api.js'
export type { ConsoleLike, LogLevel, LogRecord, LogSink, Logger, LoggerOptions, RotatingFileSinkOptions } from './logging.js'
export type { CapabilityContext, ModuleRuntime, RuntimeModule } from './module.js'
export type {
  DesktopAPI,
  IpcChannel,
  IpcChannelName,
  IpcHandlerContext,
  IpcMainLike,
  IpcRegistration,
  IpcRegistry,
  IpcRegistryOptions,
  IpcRendererLike
} from './ipc.js'
export type { Storage } from './storage.js'
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
export type { GlobalShortcutPort, ShortcutAction, ShortcutManager } from './shortcuts.js'
export type { TrayController, TrayControllerOptions, TrayLabels, TrayMenuBuilder, TrayPort, TrayWindow } from './tray.js'
export type { BuiltMenu, ContextMenuPosition, MenuItemTemplate, MenuPort, MenuService } from './menu.js'
export type {
  BuiltContextMenu,
  ContextMenuHandler,
  ContextMenuHandlerOptions,
  ContextMenuItem,
  ContextMenuPort,
  ContextMenuRequest
} from './context-menu.js'
export type { BadgeAppPort, DockPort, PlatformIntegration, PlatformIntegrationOptions, TaskbarPort, TaskbarProgressOptions } from './integration.js'
export type { Listener, ReadableStore, Store } from './reactive.js'
export type { PersistentStore, PersistentStoreOptions } from './persistent.js'
export type { StateListener, StateSync, StateSyncOptions, SyncRegistry, SyncWindow } from './state-sync.js'
export type { PreferenceListener, Preferences, PreferencesOptions } from './preferences.js'
export type { RecentEntry, RecentItem, RecentItems, RecentItemsOptions } from './recent-items.js'
export type { FileCategory } from './mime.js'
export type { DirectoryEntry } from './fs.js'
export type { StreamProgress } from './stream.js'
export type { WatchChangeType, WatchEvent, WatchFactory, WatchListener, WatchOptions, Watcher } from './watch.js'
export type { ClipboardPort, ClipboardService } from './clipboard.js'
export type {
  NotificationConstructor,
  NotificationHandlers,
  NotificationInstance,
  NotificationOptions,
  NotificationPort,
  NotificationService
} from './notifications.js'
export type { ShellPort, ShellService } from './shell.js'
export type { CpuCore, SystemInfo, SystemPort } from './system.js'
export type { BatteryStatus, PowerEventSource, PowerHandlers, PowerMonitor, PowerStatusPort } from './power.js'
export type {
  BrowserNetworkGlobal,
  NetworkEventSubscription,
  NetworkMonitor,
  NetworkMonitorOptions,
  NetworkStatus,
  NetworkStatusPort
} from './network.js'
export type { SecretStore, SecretStorePort } from './secrets.js'
export type { SocketLike, SocketStatus, WebSocketClient, WebSocketClientOptions } from './websocket.js'
export type { EventSourceLike, SseClient, SseClientOptions, SseStatus } from './sse.js'
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
export type { ProxyConfigInput, ProxyMode, ProxySession, ResolvedProxyConfig } from './proxy.js'
export type { DeepLink, DeepLinkPath } from './deep-link.js'
export type { Cache, CacheOptions } from './cache.js'
export type { KeyValueStorage } from './storage/kv.js'
export type { Database, DatabaseOptions, Migration, Repository, RepositoryOptions, SqlDriver, SqlParams } from './database.js'
export type { SqliteDriverOptions } from './sqlite.js'
export type { BackupPort, DataSnapshot, DataTransfer, DataTransferOptions, ImportOptions, RestorePort } from './data-transfer.js'
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
export type { ContentSecurityPolicyOptions, HeadersSession } from './security.js'
export type { AuthBridge, DesktopMainDeps, DesktopMainOptions, DesktopWindowOptions, StateOptions, TrayOptions } from './main.js'
