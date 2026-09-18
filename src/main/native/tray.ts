import { Menu, Tray } from 'electron'

export function createTray(iconPath: string, onShow: () => void): Tray { const tray = new Tray(iconPath); tray.setToolTip('Desktop application'); tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Show', click: onShow }, { role: 'quit' }])); return tray }
