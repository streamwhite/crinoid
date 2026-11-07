import type { ReactNode } from 'react'
import { Page, PageHeader, Stack } from '../layout.js'

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
    <Page className={className}>
      <PageHeader title={title} description={description} actions={actions} />
      {children ? (
        <Stack gap="lg" className={contentClassName}>
          {children}
        </Stack>
      ) : null}
    </Page>
  )
}
