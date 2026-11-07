import { StrictMode } from 'react'
import './index.css'
import { createRoot } from 'react-dom/client'
import { DesktopProviders, ErrorBoundary } from 'crinoid/react'
import { ChartPanel, StatCard, StatsGrid } from 'crinoid/blocks'
import { AreaChart } from 'crinoid/charts'
import { AppLayout, Page, PageHeader } from 'crinoid/layout'
import { NavItem, NavList } from 'crinoid/patterns'
import { Badge, Button } from 'crinoid/ui'
import messages from './locales/en/common.json'

const traffic = [
  { day: 'Mon', visits: 120 },
  { day: 'Tue', visits: 180 },
  { day: 'Wed', visits: 150 },
  { day: 'Thu', visits: 220 },
  { day: 'Fri', visits: 260 }
]

function App() {
  return (
    <AppLayout
      sidebar={
        <NavList>
          <NavItem active>Overview</NavItem>
          <NavItem>Settings</NavItem>
        </NavList>
      }
      header={<span className="text-sm">Overview</span>}
    >
      <Page>
        <PageHeader
          title="Overview"
          description="A layout-only example built from crinoid blocks and charts."
          actions={<Button>Refresh</Button>}
        />
        <StatsGrid>
          <StatCard label="Visitors" value="9,120" trend={<Badge>+12%</Badge>} />
          <StatCard label="Sessions" value="14,830" trend={<Badge variant="secondary">+8%</Badge>} />
          <StatCard label="Conversion" value="3.4%" trend={<Badge variant="outline">+0.4%</Badge>} />
          <StatCard label="Revenue" value="$8,420" trend={<Badge>+4%</Badge>} />
        </StatsGrid>
        <ChartPanel title="Traffic" description="Visits over the last five days">
          <AreaChart data={traffic} xKey="day" series={[{ key: 'visits', label: 'Visits' }]} height={240} />
        </ChartPanel>
      </Page>
    </AppLayout>
  )
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
