// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AppLayout, Container, Grid, Page, PageHeader, Row, Section, Split, Stack, Toolbar } from 'crinoid/layout'
import { ConfirmDialog, DataList, DataListRow, FormField, FormGrid, NavGroup, NavItem, NavList } from 'crinoid/patterns'
import { Button, Input } from 'crinoid/ui'
import { describe, expect, it, vi } from 'vitest'

describe('layout primitives', () => {
  it('renders stack, row, grid, and container presets', () => {
    const { container } = render(
      <Container size="md" padding="lg" data-testid="container">
        <Stack gap="lg">
          <Row gap="sm" justify="between">
            <span>left</span>
            <span>right</span>
          </Row>
          <Grid cols={1} mdCols={2} gap="md">
            <div>one</div>
            <div>two</div>
          </Grid>
        </Stack>
      </Container>
    )

    expect(screen.getByTestId('container').className).toContain('max-w-3xl')
    expect(screen.getByTestId('container').className).toContain('p-6')
    expect(container.querySelector('[data-slot="stack"]')?.className).toContain('gap-6')
    expect(container.querySelector('[data-slot="row"]')?.className).toContain('justify-between')
    expect(container.querySelector('[data-slot="grid"]')?.className).toContain('md:grid-cols-2')
  })

  it('renders page, section, and toolbar structure', () => {
    render(
      <Page data-testid="page">
        <PageHeader title="Projects" description="Manage work" actions={<Button>New</Button>} />
        <Section title="Active" description="In progress" actions={<Button variant="outline">Filter</Button>}>
          <Toolbar start={<span>Search</span>} end={<Button>Apply</Button>} />
        </Section>
      </Page>
    )

    expect(screen.getByTestId('page')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Active' })).toBeTruthy()
    expect(screen.getByText('Search')).toBeTruthy()
  })

  it('renders the app layout and split views', () => {
    render(
      <AppLayout sidebar={<nav>Sidebar</nav>} header={<span>Header</span>}>
        <Split primary={<div>Primary</div>} secondary={<div>Secondary</div>} />
      </AppLayout>
    )

    expect(screen.getByText('Sidebar')).toBeTruthy()
    expect(screen.getByText('Header')).toBeTruthy()
    expect(screen.getByText('Primary')).toBeTruthy()
    expect(screen.getByText('Secondary')).toBeTruthy()
  })
})

describe('patterns', () => {
  it('composes form fields without per-field styling', () => {
    render(
      <FormGrid>
        <FormField label="Name" htmlFor="name" description="Your display name" required>
          <Input id="name" />
        </FormField>
        <FormField label="Email" htmlFor="email" error="Email is required">
          <Input id="email" />
        </FormField>
      </FormGrid>
    )

    expect(screen.getByLabelText(/Name/)).toBeTruthy()
    expect(screen.getByText('Your display name')).toBeTruthy()
    expect(screen.getByText('Email is required')).toBeTruthy()
  })

  it('renders sidebar navigation without custom styles', () => {
    render(
      <NavList>
        <NavGroup label="Workspace">
          <NavItem active icon={<span>#</span>} badge="3">
            Inbox
          </NavItem>
          <NavItem href="/settings">Settings</NavItem>
        </NavGroup>
      </NavList>
    )

    expect(screen.getByRole('link', { name: 'Settings' }).getAttribute('href')).toBe('/settings')
    expect(screen.getByRole('button', { name: /Inbox/ }).getAttribute('aria-current')).toBe('page')
  })

  it('renders data list rows', () => {
    render(
      <DataList>
        <DataListRow title="Report.pdf" description="2.4 MB" meta="Today" actions={<Button size="sm">Open</Button>} />
      </DataList>
    )

    expect(screen.getByText('Report.pdf')).toBeTruthy()
    expect(screen.getByText('2.4 MB')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open' })).toBeTruthy()
  })

  it('runs the confirm dialog action and closes on success', async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Delete project?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
