export interface AboutInfo {
  readonly name: string
  readonly version: string
  readonly platform: string
  readonly arch: string
  readonly versions: Readonly<Record<string, string>>
  readonly license?: string | undefined
  readonly copyright?: string | undefined
  readonly homepage?: string | undefined
}

export interface AboutOptions {
  readonly name: string
  readonly version: string
  readonly platform: string
  readonly arch: string
  readonly versions?: Readonly<Record<string, string | undefined>> | undefined
  readonly license?: string | undefined
  readonly copyright?: string | undefined
  readonly homepage?: string | undefined
}

export function createAboutInfo(options: AboutOptions): AboutInfo {
  return {
    name: options.name,
    version: options.version,
    platform: options.platform,
    arch: options.arch,
    versions: compactVersions(options.versions ?? {}),
    ...(options.license === undefined ? {} : { license: options.license }),
    ...(options.copyright === undefined ? {} : { copyright: options.copyright }),
    ...(options.homepage === undefined ? {} : { homepage: options.homepage })
  }
}

export function formatAboutText(info: AboutInfo): string {
  const lines = [`${info.name} ${info.version}`, `${info.platform} / ${info.arch}`]
  for (const [name, version] of Object.entries(info.versions)) lines.push(`${name} ${version}`)
  if (info.license !== undefined) lines.push(info.license)
  if (info.copyright !== undefined) lines.push(info.copyright)
  return lines.join('\n')
}

function compactVersions(versions: Readonly<Record<string, string | undefined>>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [name, version] of Object.entries(versions)) {
    if (typeof version === 'string') result[name] = version
  }
  return result
}
