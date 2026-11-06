import type { ReactNode } from 'react'
import { cn } from '../ui/lib/utils.js'

export interface EmptyBlockProps {
  readonly icon?: ReactNode
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly action?: ReactNode
  readonly className?: string
}

export function EmptyBlock({ icon, title, description, action, className }: EmptyBlockProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-8 text-center',
        className
      )}
    >
      {icon ? <div className="text-muted-foreground [&>svg]:size-8">{icon}</div> : null}
      <div className="grid gap-1">
        <div className="text-base font-medium">{title}</div>
        {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}
