import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.js'
import { Separator } from '../ui/separator.js'
import { cn } from '../ui/lib/utils.js'

export interface SettingsBlockProps {
  readonly title?: ReactNode
  readonly description?: ReactNode
  readonly children?: ReactNode
  readonly footer?: ReactNode
  readonly className?: string
}

export function SettingsBlock({
  title,
  description,
  children,
  footer,
  className
}: SettingsBlockProps): React.JSX.Element {
  return (
    <Card className={cn('gap-0', className)}>
      {title || description ? (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent className="grid gap-6">{children}</CardContent>
      {footer ? (
        <>
          <Separator />
          <CardContent className="py-4 text-sm text-muted-foreground">{footer}</CardContent>
        </>
      ) : null}
    </Card>
  )
}

export interface SettingsSectionProps {
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
}

export function SettingsSection({ title, description, children, className }: SettingsSectionProps): React.JSX.Element {
  return (
    <section className={cn('grid gap-4 border-b pb-6 last:border-b-0 last:pb-0', className)}>
      <div className="grid gap-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

export interface SettingsRowProps {
  readonly label: ReactNode
  readonly description?: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

export function SettingsRow({ label, description, children, className }: SettingsRowProps): React.JSX.Element {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4', className)}>
      <div className="grid gap-0.5">
        <div className="text-sm font-medium">{label}</div>
        {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
