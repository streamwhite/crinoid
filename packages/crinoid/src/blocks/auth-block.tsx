import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card.js'
import { cn } from '../ui/lib/utils.js'

export interface AuthBlockProps {
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly children: ReactNode
  readonly footer?: ReactNode
  readonly badge?: ReactNode
  readonly className?: string
  readonly cardClassName?: string
}

export function AuthBlock({
  title,
  description,
  children,
  footer,
  badge,
  className,
  cardClassName
}: AuthBlockProps): React.JSX.Element {
  return (
    <div className={cn('flex min-h-svh items-center justify-center bg-muted/40 p-6', className)}>
      <Card className={cn('w-full max-w-sm', cardClassName)}>
        <CardHeader className="gap-2 text-center">
          {badge ? <div className="flex justify-center">{badge}</div> : null}
          <CardTitle className="text-xl">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer ? <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter> : null}
      </Card>
    </div>
  )
}
