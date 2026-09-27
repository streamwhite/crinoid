import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell, DesktopProviders, ErrorBoundary } from 'crinoid/react'
import messages from './locales/en/common.json'

function App() {
  return <AppShell />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={(error) => <p role="alert">{error.message}</p>}>
      <DesktopProviders locale="en" messages={messages}>
        <App />
      </DesktopProviders>
    </ErrorBoundary>
  </StrictMode>
)
