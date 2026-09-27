export const content = {
  fully_currently_essential: [
    `现在这个项目可以支持发布到npm或者private npm兼容的registry,确保能够`,
    `两个地方都要继续`,
    `整个项目作为一个package下载发布更新等等,其他所有像electron作为它的依赖,就像其他package包含很多依赖一样.只要这个package更新对应的依赖也会更新.`,
    `peerdeps 要更新一些, template package下面json`,
    `'pnpm changeset && pnpm version:packages && pnpm publish:packages' 发布的时候不应该是这样,应该是类似react package一样,直接npm publish或者pnpm类似命令`,
    `'private: true 的五个子包被自动跳过'这些为什么会被跳过,electron-desktop-template需要里边的功能(暴露函数)`,
    [
      `目标:构建 opinioned桌面端端开发框架(导出接口),基于electron,易于新项目开发(只要便于功能快速开发都可以),整个作为一个package用到新项目(后续如果更新可以快速同步到项目里边),需要你建议一些需要的常用功能,列出这些功能即可`,
      `### opinioned Desktop Framework（Electron）建议内置功能

**基础架构**

* Electron 主进程 / Renderer / Preload 封装
* IPC 类型安全封装
* 自动注册 IPC Handler
* Window Manager
* 多窗口管理
* 单实例锁
* App 生命周期管理
* Graceful Shutdown
* 环境配置管理
* 开发 / 测试 / 生产环境区分
* 全局错误处理
* 全局日志

**窗口与界面**

* 主窗口创建
* 子窗口 / Dialog
* Window 状态持久化
* 窗口尺寸与位置恢复
* 最小化到托盘
* 系统托盘
* Dock / Taskbar 集成
* 全屏
* Always on Top
* 自定义窗口标题栏
* 原生菜单
* Context Menu
* 快捷键 / Global Shortcut

**应用状态**

* 全局 Store
* 持久化 Store
* Reactive State
* 跨窗口状态同步
* 用户偏好设置
* 最近打开记录
* 最近访问文件 / 项目

**文件系统**

* Open File Dialog
* Save File Dialog
* Open Directory Dialog
* File / Directory Picker
* 文件读写 API
* 大文件流式读写
* 文件监控
* 文件复制 / 移动 / 删除
* 路径工具
* MIME / 文件类型检测
* 最近文件

**系统能力**

* Clipboard
* Native Notifications
* Shell API
* URL 打开
* 文件打开
* 系统信息获取
* CPU / Memory / Disk 信息
* OS / Architecture 检测
* 电源状态
* 网络状态

**安全**

* Context Isolation
* Sandbox
* CSP
* IPC 权限控制
* IPC 输入校验
* 安全的 Renderer API
* Secret / Token 安全存储
* Keychain / Credential Manager
* 禁止 Node.js 直接暴露给 Renderer

**网络**

* HTTP Client
* WebSocket
* SSE
* 请求重试
* Timeout
* Offline 检测
* 网络状态监听
* Download Manager
* Upload Manager
* Proxy 配置

**认证**

* Login / Logout
* Session 管理
* Token 管理
* OAuth
* Deep Link / Custom Protocol
* 自动恢复 Session

**数据库 / 本地数据**

* SQLite
* 数据库迁移
* Repository 封装
* 本地 Cache
* Key-Value Storage
* IndexedDB 封装
* 数据导入 / 导出
* Backup / Restore

**任务系统**

* Background Task
* Job Queue
* Cron / Scheduler
* Worker
* Worker Pool
* Task Progress
* Task Cancellation
* Task Retry
* Task Status
* 并发控制

**更新与发布**

* Auto Update
* Update Check
* Download Update
* Install Update
* Update Progress
* Rollback / Recovery
* App Version 管理
* Release Channel（stable / beta）

**错误与可观测性**

* Error Boundary
* Crash Reporting
* Structured Logging
* Log Rotation
* Performance Metrics
* IPC 调用 tracing
* Task tracing
* 用户反馈 / Report Issue

**国际化**

* i18n(use pkg formatjs react-intl)
* Locale Detection
* Locale Switching
* Timezone
* Number / Currency Formatting
* Date Formatting
* RTL 支持

**开发体验(暂时放弃)**

* CLI
* Project Template
* Feature Generator
* IPC Generator
* Window Generator
* Service Generator
* Store Generator
* Database Migration Generator
* Environment Generator
* 类型自动生成
* 开发模式热重载
* Mock API
* Test Utilities

**测试**

* Unit Test Utilities
* IPC Test Utilities
* Main Process Test Utilities
* Renderer Test Utilities
* E2E Test Utilities
* Mock Electron API
* Test Fixtures

**应用常见业务能力**

* Settings
* About
* Help
* Feedback
* Keyboard Shortcuts
* Command Palette
* Search
* Recent Items
* Favorites
* Import / Export
* Undo / Redo
* Drag & Drop

**桌面特有能力**

* Deep Link
* Drag & Drop 文件
* OS Startup
* Single Instance
* System Tray
* Notification
* Global Shortcut
* Clipboard Image


对于 **opinionated framework**，核心目标建议不是把 Electron API 全部重新封装一遍，而是把**绝大多数桌面应用反复实现的基础设施直接标准化**，让新项目主要只写业务功能。
`,
    ],
    [
      `将这个项目名称改成crinoid以及对应的地方;这个项目添加私有registry:https://registry.piaosiyuan.cn/js/,`,
    ],
  ],
};
