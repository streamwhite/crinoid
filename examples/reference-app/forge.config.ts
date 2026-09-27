import { createForgeConfig } from 'crinoid/forge'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { VitePlugin } from '@electron-forge/plugin-vite'
import { FuseV1Options, FuseVersion } from '@electron/fuses'

export default createForgeConfig({
  packagerConfig: { executableName: 'reference-app' },
  makers: [],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main/index.ts', config: 'vite.main.config.mts' },
        { entry: 'src/preload/index.ts', config: 'vite.preload.config.mts' }
      ],
      renderer: [{ name: 'main_window', config: 'vite.config.mts' }]
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableCookieEncryption]: true
    })
  ]
})
