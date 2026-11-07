import { useState, type ReactNode } from 'react'
import { Button } from './ui/button.js'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog.js'
import { Label } from './ui/label.js'
import { cn } from './ui/lib/utils.js'
import { Grid } from './layout.js'

export interface FormFieldProps {
  readonly label?: ReactNode
  readonly description?: ReactNode
  readonly error?: ReactNode
  readonly required?: boolean
  readonly htmlFor?: string
  readonly children: ReactNode
  readonly className?: string
}

export function FormField({
  label,
  description,
  error,
  required = false,
  htmlFor,
  children,
  className
}: FormFieldProps): React.JSX.Element {
  return (
    <div data-slot="form-field" className={cn('grid gap-2', className)}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export interface FormGridProps {
  readonly children: ReactNode
  readonly className?: string
}

export function FormGrid({ children, className }: FormGridProps): React.JSX.Element {
  return (
    <Grid cols={1} smCols={2} gap="md" className={className}>
      {children}
    </Grid>
  )
}

export interface ConfirmDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly confirmLabel?: ReactNode
  readonly cancelLabel?: ReactNode
  readonly destructive?: boolean
  readonly onConfirm: () => void | Promise<void>
  readonly children?: ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  children
}: ConfirmDialogProps): React.JSX.Element {
  const [busy, setBusy] = useState(false)

  const confirm = async (): Promise<void> => {
    setBusy(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // Keep the dialog open so the caller can surface the failure.
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={busy}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button variant={destructive ? 'destructive' : 'default'} disabled={busy} onClick={() => void confirm()}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export interface DataListProps {
  readonly children: ReactNode
  readonly className?: string
}

export function DataList({ children, className }: DataListProps): React.JSX.Element {
  return (
    <div data-slot="data-list" className={cn('divide-y overflow-hidden rounded-xl border bg-card', className)}>
      {children}
    </div>
  )
}

export interface DataListRowProps {
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly meta?: ReactNode
  readonly actions?: ReactNode
  readonly className?: string
}

export function DataListRow({ title, description, meta, actions, className }: DataListRowProps): React.JSX.Element {
  return (
    <div
      data-slot="data-list-row"
      className={cn('flex flex-wrap items-center justify-between gap-4 px-4 py-3', className)}
    >
      <div className="grid min-w-0 gap-0.5">
        <div className="truncate text-sm font-medium">{title}</div>
        {description ? <div className="truncate text-sm text-muted-foreground">{description}</div> : null}
      </div>
      <div className="flex items-center gap-3">
        {meta ? <span className="text-sm text-muted-foreground tabular-nums">{meta}</span> : null}
        {actions}
      </div>
    </div>
  )
}

export interface NavListProps {
  readonly children: ReactNode
  readonly className?: string
}

export function NavList({ children, className }: NavListProps): React.JSX.Element {
  return (
    <nav data-slot="nav-list" className={cn('grid gap-1 p-2', className)}>
      {children}
    </nav>
  )
}

export interface NavGroupProps {
  readonly label?: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

export function NavGroup({ label, children, className }: NavGroupProps): React.JSX.Element {
  return (
    <div data-slot="nav-group" className={cn('grid gap-1', className)}>
      {label ? <div className="px-3 pt-3 text-xs font-medium text-muted-foreground">{label}</div> : null}
      {children}
    </div>
  )
}

export interface NavItemProps {
  readonly children: ReactNode
  readonly icon?: ReactNode
  readonly badge?: ReactNode
  readonly active?: boolean
  readonly href?: string
  readonly onSelect?: () => void
  readonly className?: string
}

export function NavItem({
  children,
  icon,
  badge,
  active = false,
  href,
  onSelect,
  className
}: NavItemProps): React.JSX.Element {
  const classes = cn(
    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors [&>svg]:size-4 [&>svg]:shrink-0',
    active
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
    className
  )

  const content = (
    <>
      {icon}
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      {badge}
    </>
  )

  if (href) {
    return (
      <a
        data-slot="nav-item"
        data-active={active ? '' : undefined}
        aria-current={active ? 'page' : undefined}
        href={href}
        className={classes}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      data-slot="nav-item"
      data-active={active ? '' : undefined}
      aria-current={active ? 'page' : undefined}
      type="button"
      onClick={onSelect}
      className={classes}
    >
      {content}
    </button>
  )
}
