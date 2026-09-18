import type { DesktopAPI } from '@/shared/ipc/types'

declare global { interface Window { desktop: DesktopAPI } }
export {}
