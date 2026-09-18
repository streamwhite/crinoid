import { Menu } from 'electron'

export function registerApplicationMenu(): void { Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'Application', submenu: [{ role: 'quit' }] }, { role: 'viewMenu' }, { role: 'windowMenu' }])) }
