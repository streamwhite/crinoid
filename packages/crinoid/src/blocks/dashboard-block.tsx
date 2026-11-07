import type { ReactNode } from 'react'
import { Page, PageHeader } from '../layout.js'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.js'
import { cn } from '../ui/lib/utils.js'

export interface DashboardBlockProps {
  readonly title?: ReactNode
  readonly description?: ReactNode
  readonly actions?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
}

export function DashboardBlock({
  title,
  description,
  actions,
  children,
  className
}: DashboardBlockProps): React.JSX.Element {
  return (
    <Page className={className}>
      {title || description || actions ? (
        <PageHeader title={title} description={description} actions={actions} />
      ) : null}
      <div className="flex flex-col gap-6">{children}</div>
    </Page>
  )
}

export interface StatsGridProps {
  readonly children: ReactNode
  readonly className?: string
}

export function StatsGrid({ children, className }: StatsGridProps): React.JSX.Element {
  return <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
}

export interface StatCardProps {
  readonly label: ReactNode
  readonly value: ReactNode
  readonly description?: ReactNode
  readonly icon?: ReactNode
  readonly trend?: ReactNode
  readonly className?: string
}

export function StatCard({ label, value, description, icon, trend, className }: StatCardProps): React.JSX.Element {
  return (
    <Card className={cn('gap-2 py-5', className)}>
      <CardHeader className="gap-1">
        <CardDescription className="flex items-center justify-between gap-2">
          <span>{label}</span>
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
        <CardAction>{trend}</CardAction>
      </CardHeader>
      {description ? <CardContent className="text-sm text-muted-foreground">{description}</CardContent> : null}
    </Card>
  )
}

export interface ChartPanelProps {
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly actions?: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

export function ChartPanel({ title, description, actions, children, className }: ChartPanelProps): React.JSX.Element {
  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {actions ? <CardAction>{actions}</CardAction> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
