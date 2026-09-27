import { isAllowedExternalUrl } from './security.js'

export interface HelpServiceOptions {
  readonly openExternal: (url: string) => Promise<void>
  readonly links: Readonly<Record<string, string>>
}

export interface HelpService {
  links(): Readonly<Record<string, string>>
  has(key: string): boolean
  open(key: string): Promise<boolean>
}

export function createHelpService(options: HelpServiceOptions): HelpService {
  return {
    links: () => options.links,
    has: (key) => typeof options.links[key] === 'string',
    open: async (key) => {
      const url = options.links[key]
      if (url === undefined || !isAllowedExternalUrl(url)) return false
      await options.openExternal(url)
      return true
    }
  }
}
