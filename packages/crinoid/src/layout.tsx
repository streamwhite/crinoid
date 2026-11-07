import type { ComponentProps, ReactNode } from 'react'
import { cn } from './ui/lib/utils.js'

export type Gap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around'
export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const GAP_CLASSES: Record<Gap, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
}

const PADDING_CLASSES: Record<Gap, string> = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8'
}

const ALIGN_CLASSES: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline'
}

const JUSTIFY_CLASSES: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around'
}

const CONTAINER_CLASSES: Record<ContainerSize, string> = {
  sm: 'max-w-xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
  full: 'max-w-none'
}

const COL_CLASSES = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  12: 'grid-cols-12'
} as const

const SM_COL_CLASSES = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  6: 'sm:grid-cols-6',
  12: 'sm:grid-cols-12'
} as const

const MD_COL_CLASSES = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  6: 'md:grid-cols-6',
  12: 'md:grid-cols-12'
} as const

const LG_COL_CLASSES = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  6: 'lg:grid-cols-6',
  12: 'lg:grid-cols-12'
} as const

const XL_COL_CLASSES = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  6: 'xl:grid-cols-6',
  12: 'xl:grid-cols-12'
} as const

type Columns = keyof typeof COL_CLASSES

export interface StackProps extends ComponentProps<'div'> {
  readonly gap?: Gap
  readonly align?: Align
  readonly justify?: Justify
}

export function Stack({ gap = 'md', align, justify, className, ...props }: StackProps): React.JSX.Element {
  return (
    <div
      data-slot="stack"
      className={cn(
        'flex flex-col',
        GAP_CLASSES[gap],
        align && ALIGN_CLASSES[align],
        justify && JUSTIFY_CLASSES[justify],
        className
      )}
      {...props}
    />
  )
}

export interface RowProps extends StackProps {
  readonly wrap?: boolean
}

export function Row({
  gap = 'sm',
  align = 'center',
  justify,
  wrap = false,
  className,
  ...props
}: RowProps): React.JSX.Element {
  return (
    <div
      data-slot="row"
      className={cn(
        'flex flex-row',
        GAP_CLASSES[gap],
        ALIGN_CLASSES[align],
        justify && JUSTIFY_CLASSES[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    />
  )
}

export interface GridProps extends ComponentProps<'div'> {
  readonly cols?: Columns
  readonly smCols?: Columns
  readonly mdCols?: Columns
  readonly lgCols?: Columns
  readonly xlCols?: Columns
  readonly gap?: Gap
}

export function Grid({
  cols = 1,
  smCols,
  mdCols,
  lgCols,
  xlCols,
  gap = 'md',
  className,
  ...props
}: GridProps): React.JSX.Element {
  return (
    <div
      data-slot="grid"
      className={cn(
        'grid',
        COL_CLASSES[cols],
        smCols && SM_COL_CLASSES[smCols],
        mdCols && MD_COL_CLASSES[mdCols],
        lgCols && LG_COL_CLASSES[lgCols],
        xlCols && XL_COL_CLASSES[xlCols],
        GAP_CLASSES[gap],
        className
      )}
      {...props}
    />
  )
}

export interface ContainerProps extends ComponentProps<'div'> {
  readonly size?: ContainerSize
  readonly padding?: Gap
}

export function Container({ size = 'lg', padding = 'none', className, ...props }: ContainerProps): React.JSX.Element {
  return (
    <div
      data-slot="container"
      className={cn('mx-auto w-full', CONTAINER_CLASSES[size], PADDING_CLASSES[padding], className)}
      {...props}
    />
  )
}

export interface PageProps extends ComponentProps<'div'> {
  readonly gap?: Gap
}

export function Page({ gap = 'lg', className, ...props }: PageProps): React.JSX.Element {
  return <div data-slot="page" className={cn('flex min-h-0 flex-1 flex-col', GAP_CLASSES[gap], className)} {...props} />
}

export interface PageHeaderProps {
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly actions?: ReactNode
  readonly className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps): React.JSX.Element {
  return (
    <header data-slot="page-header" className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <Stack gap="xs">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </Stack>
      {actions ? <Row gap="sm">{actions}</Row> : null}
    </header>
  )
}

export interface SectionProps {
  readonly title?: ReactNode
  readonly description?: ReactNode
  readonly actions?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
  readonly contentClassName?: string
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
  contentClassName
}: SectionProps): React.JSX.Element {
  return (
    <section data-slot="section" className={cn('flex flex-col gap-4', className)}>
      {title || description || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3">
          <Stack gap="xs">
            {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </Stack>
          {actions ? <Row gap="sm">{actions}</Row> : null}
        </header>
      ) : null}
      {children ? <div className={cn('flex flex-col gap-4', contentClassName)}>{children}</div> : null}
    </section>
  )
}

export interface ToolbarProps extends Omit<StackProps, 'align' | 'justify'> {
  readonly start?: ReactNode
  readonly end?: ReactNode
}

export function Toolbar({ start, end, children, gap = 'sm', className, ...props }: ToolbarProps): React.JSX.Element {
  return (
    <div data-slot="toolbar" className={cn('flex flex-wrap items-center justify-between gap-3', className)} {...props}>
      <Row gap={gap}>{start ?? children}</Row>
      {end ? <Row gap={gap}>{end}</Row> : null}
    </div>
  )
}

export interface SplitProps {
  readonly primary: ReactNode
  readonly secondary: ReactNode
  readonly secondaryPosition?: 'left' | 'right'
  readonly className?: string
}

export function Split({ primary, secondary, secondaryPosition = 'right', className }: SplitProps): React.JSX.Element {
  return (
    <div
      data-slot="split"
      className={cn(
        'grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]',
        secondaryPosition === 'left' && 'lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]',
        className
      )}
    >
      {secondaryPosition === 'left' ? (
        <>
          <div className="min-h-0">{secondary}</div>
          <div className="min-h-0">{primary}</div>
        </>
      ) : (
        <>
          <div className="min-h-0">{primary}</div>
          <div className="min-h-0">{secondary}</div>
        </>
      )}
    </div>
  )
}

export interface AppLayoutProps {
  readonly sidebar: ReactNode
  readonly header?: ReactNode
  readonly children: ReactNode
  readonly sidebarWidth?: 'sm' | 'md' | 'lg'
  readonly className?: string
  readonly contentClassName?: string
}

const SIDEBAR_CLASSES = {
  sm: 'grid-cols-[13rem_minmax(0,1fr)]',
  md: 'grid-cols-[16rem_minmax(0,1fr)]',
  lg: 'grid-cols-[20rem_minmax(0,1fr)]'
} as const

export function AppLayout({
  sidebar,
  header,
  children,
  sidebarWidth = 'md',
  className,
  contentClassName
}: AppLayoutProps): React.JSX.Element {
  return (
    <div
      data-slot="app-layout"
      className={cn('grid min-h-svh bg-background text-foreground', SIDEBAR_CLASSES[sidebarWidth], className)}
    >
      <aside className="flex min-h-0 flex-col border-r bg-sidebar text-sidebar-foreground">{sidebar}</aside>
      <div className="flex min-h-0 flex-col">
        {header ? <header className="flex h-14 shrink-0 items-center border-b px-6">{header}</header> : null}
        <main className={cn('min-h-0 flex-1 overflow-auto p-6', contentClassName)}>{children}</main>
      </div>
    </div>
  )
}
