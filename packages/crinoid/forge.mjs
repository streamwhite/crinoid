export function securePackagerConfig(overrides = {}) {
  return { asar: true, ...overrides }
}

export function createForgeConfig(config) {
  return {
    packagerConfig: securePackagerConfig(config.packagerConfig),
    rebuildConfig: config.rebuildConfig ?? {},
    makers: config.makers ?? [],
    plugins: config.plugins ?? [],
    publishers: config.publishers ?? []
  }
}
