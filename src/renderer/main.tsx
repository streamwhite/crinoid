import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IntlProvider } from 'react-intl'
import messages from '@/renderer/locales/en/common.json'
import zhMessages from '@/renderer/locales/zh-CN/common.json'
import { config } from '@/config/env'
import { App } from '@/renderer/app/App'
import { AppProviders } from '@/renderer/providers/AppProviders'
import './styles.css'

const locale = config.defaultLocale === 'zh-CN' ? 'zh-CN' : 'en'
const localeMessages = locale === 'zh-CN' ? zhMessages : messages
createRoot(document.getElementById('root')!).render(<StrictMode><IntlProvider locale={locale} messages={localeMessages}><AppProviders><App /></AppProviders></IntlProvider></StrictMode>)
