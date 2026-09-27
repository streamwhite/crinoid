export interface KeyEventLike {
  readonly key: string
  readonly ctrlKey?: boolean | undefined
  readonly metaKey?: boolean | undefined
  readonly altKey?: boolean | undefined
  readonly shiftKey?: boolean | undefined
}

export interface KeybindingParts {
  readonly key: string
  readonly ctrl: boolean
  readonly meta: boolean
  readonly alt: boolean
  readonly shift: boolean
}

const CMD_OR_CTRL = 'cmdorctrl'
const COMMAND_OR_CONTROL = 'commandorcontrol'
const DARWIN = 'darwin'

const MODIFIER_ALIASES: Readonly<Record<string, 'ctrl' | 'meta' | 'alt' | 'shift'>> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  cmd: 'meta',
  command: 'meta',
  meta: 'meta',
  super: 'meta',
  alt: 'alt',
  option: 'alt',
  shift: 'shift'
}

const KEY_ALIASES: Readonly<Record<string, string>> = {
  space: ' ',
  spacebar: ' ',
  esc: 'escape',
  return: 'enter',
  del: 'delete',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright'
}

export function platformName(): string {
  return typeof process === 'undefined' ? '' : process.platform
}

function normalizeKeyName(value: string): string {
  const lower = value.toLowerCase()
  if (lower.length === 1) return lower
  const trimmed = lower.trim()
  return KEY_ALIASES[trimmed] ?? trimmed
}

export function parseKeybinding(binding: string, platform: string = platformName()): KeybindingParts {
  let ctrl = false
  let meta = false
  let alt = false
  let shift = false
  let key = ''

  for (const part of binding.split('+')) {
    const token = part.trim().toLowerCase()
    if (!token) continue
    if (token === CMD_OR_CTRL || token === COMMAND_OR_CONTROL) {
      if (platform === DARWIN) meta = true
      else ctrl = true
      continue
    }
    const modifier = MODIFIER_ALIASES[token]
    if (modifier === 'ctrl') ctrl = true
    else if (modifier === 'meta') meta = true
    else if (modifier === 'alt') alt = true
    else if (modifier === 'shift') shift = true
    else key = normalizeKeyName(part)
  }

  return { key, ctrl, meta, alt, shift }
}

export function matchesKeybinding(event: KeyEventLike, binding: string, platform: string = platformName()): boolean {
  const parsed = parseKeybinding(binding, platform)
  if (!parsed.key) return false
  return (
    normalizeKeyName(event.key) === parsed.key &&
    Boolean(event.ctrlKey) === parsed.ctrl &&
    Boolean(event.metaKey) === parsed.meta &&
    Boolean(event.altKey) === parsed.alt &&
    Boolean(event.shiftKey) === parsed.shift
  )
}

export function formatKeybinding(binding: string, platform: string = platformName()): string {
  const parsed = parseKeybinding(binding, platform)
  const parts: string[] = []
  if (parsed.ctrl) parts.push('Ctrl')
  if (parsed.meta) parts.push('Meta')
  if (parsed.alt) parts.push('Alt')
  if (parsed.shift) parts.push('Shift')
  parts.push(parsed.key.length === 1 ? parsed.key.toUpperCase() : capitalize(parsed.key))
  return parts.join('+')
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1)
}

export interface KeybindingRegistry {
  register(binding: string, action: () => void): () => void
  unregister(binding: string): void
  handle(event: KeyEventLike): boolean
  list(): readonly string[]
}

export function createKeybindingRegistry(platform: string = platformName()): KeybindingRegistry {
  const bindings = new Map<string, () => void>()

  return {
    register: (binding, action) => {
      bindings.set(binding, action)
      return () => bindings.delete(binding)
    },
    unregister: (binding) => {
      bindings.delete(binding)
    },
    handle: (event) => {
      for (const [binding, action] of bindings) {
        if (!matchesKeybinding(event, binding, platform)) continue
        action()
        return true
      }
      return false
    },
    list: () => [...bindings.keys()]
  }
}
