/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
import type { DesktopAPI } from 'crinoid/ipc'

declare global {
  interface Window {
    desktop: DesktopAPI
  }
}

export {}
