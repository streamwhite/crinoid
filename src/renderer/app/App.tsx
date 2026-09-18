import { FormattedMessage, useIntl } from 'react-intl'
import { useTheme, ThemeProvider } from './theme'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const intl = useIntl()
  return <select aria-label={intl.formatMessage({ id: 'theme.label', defaultMessage: 'Theme' })} value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)}><option value="system"><FormattedMessage id="theme.system" defaultMessage="System" /></option><option value="light"><FormattedMessage id="theme.light" defaultMessage="Light" /></option><option value="dark"><FormattedMessage id="theme.dark" defaultMessage="Dark" /></option></select>
}

function Shell() {
  return <div className="app-shell"><aside><strong><FormattedMessage id="app.name" defaultMessage="Desktop Template" /></strong><nav><a href="#home"><FormattedMessage id="navigation.home" defaultMessage="Overview" /></a><a href="#settings"><FormattedMessage id="navigation.settings" defaultMessage="Settings" /></a></nav></aside><section className="content"><header><span><FormattedMessage id="navigation.home" defaultMessage="Overview" /></span><div className="header-actions"><ThemeToggle /><button onClick={() => window.desktop.window.minimize()}><FormattedMessage id="window.minimize" defaultMessage="Minimize" /></button></div></header><main className="page"><p className="eyebrow"><FormattedMessage id="app.eyebrow" defaultMessage="FOUNDATION / SECURE BY DEFAULT" /></p><h1><FormattedMessage id="app.title" defaultMessage="Build your desktop product on a strong foundation." /></h1><p className="subtitle"><FormattedMessage id="app.subtitle" defaultMessage="Electron infrastructure is ready. Your product can stay focused on its own features." /></p><div className="status-card"><span className="status-dot" /><div><strong><FormattedMessage id="status.ready" defaultMessage="Foundation ready" /></strong><p><FormattedMessage id="status.description" defaultMessage="The renderer is isolated from Node.js and native capabilities are exposed through typed IPC." /></p></div></div></main></section></div>
}

export function App() { return <ThemeProvider><Shell /></ThemeProvider> }
