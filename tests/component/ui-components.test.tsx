// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import {
  AuthBlock,
  ChartPanel,
  DashboardBlock,
  EmptyBlock,
  PageBlock,
  SettingsBlock,
  SettingsRow,
  SettingsSection,
  StatCard,
  StatsGrid
} from 'crinoid/blocks'
import { BarChart, DonutChart, LineChart } from 'crinoid/charts'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Input,
  Label,
  Separator,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea
} from 'crinoid/ui'
import { describe, expect, it } from 'vitest'

describe('ui primitives', () => {
  it('merges conflicting tailwind classes', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4')
  })

  it('renders button variants with data attributes', () => {
    render(
      <Button variant="outline" size="sm">
        Save
      </Button>
    )

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button.dataset.variant).toBe('outline')
    expect(button.dataset.size).toBe('sm')
  })

  it('supports asChild for links', () => {
    render(
      <Button asChild>
        <a href="/docs">Docs</a>
      </Button>
    )

    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link.dataset.slot).toBe('button')
    expect(link.getAttribute('href')).toBe('/docs')
  })

  it('renders form controls and card content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your details</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="Ada" />
          <Textarea aria-label="Bio" defaultValue="Engineer" />
          <Switch aria-label="Notifications" defaultChecked />
        </CardContent>
      </Card>
    )

    expect(screen.getByText('Profile')).toBeTruthy()
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Ada')
    expect((screen.getByLabelText('Bio') as HTMLTextAreaElement).value).toBe('Engineer')
    expect(screen.getByRole('switch', { name: 'Notifications' }).getAttribute('data-state')).toBe('checked')
  })

  it('renders feedback and table primitives', () => {
    render(
      <>
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>Something changed.</AlertDescription>
        </Alert>
        <Badge variant="secondary">Beta</Badge>
        <Separator />
        <Skeleton data-testid="skeleton" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Ada</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>
    )

    expect(screen.getByText('Heads up')).toBeTruthy()
    expect(screen.getByText('Beta')).toBeTruthy()
    expect(screen.getByTestId('skeleton')).toBeTruthy()
    expect(screen.getByRole('row', { name: 'Name' })).toBeTruthy()
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeTruthy()
  })

  it('switches tabs', () => {
    render(
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="general">General panel</TabsContent>
        <TabsContent value="advanced">Advanced panel</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('General panel')).toBeTruthy()
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Advanced' }))
    expect(screen.getByText('Advanced panel')).toBeTruthy()
  })
})

describe('chart wrappers', () => {
  it('renders line, bar, and donut wrappers', () => {
    const data = [
      { month: 'Jan', value: 12, other: 8 },
      { month: 'Feb', value: 18, other: 11 }
    ]

    const { container } = render(
      <div>
        <LineChart data={data} xKey="month" series={[{ key: 'value', label: 'Value' }]} height={180} />
        <BarChart data={data} xKey="month" series={[{ key: 'value' }, { key: 'other' }]} height={180} />
        <DonutChart data={data} nameKey="month" valueKey="value" height={180} />
      </div>
    )

    expect(container.querySelectorAll('[data-slot="chart"]').length).toBe(3)
    expect(container.querySelectorAll('.recharts-wrapper').length).toBe(3)
  })
})

describe('blocks', () => {
  it('renders a page with header actions and content', () => {
    render(
      <PageBlock title="Projects" description="Manage your work" actions={<Button>New</Button>}>
        <div>Project list</div>
      </PageBlock>
    )

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New' })).toBeTruthy()
    expect(screen.getByText('Project list')).toBeTruthy()
  })

  it('renders settings sections and rows', () => {
    render(
      <SettingsBlock title="Settings" description="Preferences">
        <SettingsSection title="General" description="Appearance">
          <SettingsRow label="Theme" description="Light or dark">
            <Switch aria-label="Dark mode" />
          </SettingsRow>
        </SettingsSection>
      </SettingsBlock>
    )

    expect(screen.getByText('Settings')).toBeTruthy()
    expect(screen.getByText('General')).toBeTruthy()
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeTruthy()
  })

  it('renders dashboard stats and panels', () => {
    render(
      <DashboardBlock title="Overview" description="This week">
        <StatsGrid>
          <StatCard label="Users" value="1,248" trend="+12%" />
        </StatsGrid>
        <ChartPanel title="Traffic" description="Last 7 days">
          <div>Chart</div>
        </ChartPanel>
      </DashboardBlock>
    )

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeTruthy()
    expect(screen.getByText('1,248')).toBeTruthy()
    expect(screen.getByText('Chart')).toBeTruthy()
  })

  it('renders auth and empty blocks', () => {
    render(
      <>
        <AuthBlock title="Sign in" description="Welcome back" footer="No account?">
          <Button>Continue</Button>
        </AuthBlock>
        <EmptyBlock title="No files" description="Upload a file to get started" action={<Button>Upload</Button>} />
      </>
    )

    expect(screen.getByText('Sign in')).toBeTruthy()
    expect(screen.getByText('No files')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeTruthy()
  })
})
