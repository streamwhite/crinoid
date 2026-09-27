import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DesktopProviders, AppShell } from 'crinoid/react'
import messages from './locales/en/common.json'

function App() {
  return <AppShell />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesktopProviders locale="en" messages={messages}>
      <App />
    </DesktopProviders>
  </StrictMode>
)
