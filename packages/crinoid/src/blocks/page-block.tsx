import type { ReactNode } from 'react'
import { cn } from '../ui/lib/utils.js'

export interface PageBlockProps {
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly actions?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
  readonly contentClassName?: string
}

export function PageBlock({
  title,
  description,
  actions,
  children,
  className,
  contentClassName
}: PageBlockProps): React.JSX.Element {
  return (
    <section className={cn('flex flex-col gap-6', className)}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children ? <div className={cn('flex flex-col gap-6', contentClassName)}>{children}</div> : null}
    </section>
  )
}
