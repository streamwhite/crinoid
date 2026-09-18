import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { VitePlugin } from '@electron-forge/plugin-vite'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'
import { FuseV1Options, FuseVersion } from '@electron/fuses'
import MakerDeb from '@electron-forge/maker-deb'
import MakerDmg from '@electron-forge/maker-dmg'
import MakerSquirrel from '@electron-forge/maker-squirrel'
import MakerZIP from '@electron-forge/maker-zip'
import MakerRpm from '@electron-forge/maker-rpm'
import MakerAppImage from '@reforged/maker-appimage'
import PublisherGithub from '@electron-forge/publisher-github'

interface ForgeConfig { packagerConfig: Record<string, unknown>; rebuildConfig: Record<string, unknown>; makers: unknown[]; plugins: unknown[]; publishers: unknown[] }

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as { name: string }
const repository = process.env.GITHUB_REPOSITORY?.split('/')
const [repositoryOwner, repositoryName] = repository ?? []
const signingEnabled = Boolean(process.env.CSC_LINK)

const config: ForgeConfig = {
  packagerConfig: { asar: true, executableName: packageJson.name, ...(signingEnabled ? { osxSign: {}, certificateFile: process.env.CSC_LINK, certificatePassword: process.env.CSC_KEY_PASSWORD } : {}), ...(process.env.APPLE_ID ? { osxNotarize: { appleId: process.env.APPLE_ID, appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD, teamId: process.env.APPLE_TEAM_ID } } : {}) },
  rebuildConfig: {},
  makers: [new MakerSquirrel({ name: packageJson.name }), new MakerZIP({}, ['darwin', 'linux', 'win32']), new MakerDmg({}), new MakerDeb({}), new MakerRpm({}), new MakerAppImage({})],
  plugins: [
    new VitePlugin({ build: [{ entry: 'src/main/index.ts', config: 'vite.main.config.mts' }, { entry: 'src/preload/index.ts', config: 'vite.preload.config.mts' }], renderer: [{ name: 'main_window', config: 'vite.config.mts' }] }),
    new AutoUnpackNativesPlugin({}),
    new FusesPlugin({ version: FuseVersion.V1, [FuseV1Options.RunAsNode]: false, [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false, [FuseV1Options.EnableNodeCliInspectArguments]: false, [FuseV1Options.EnableCookieEncryption]: true })
  ],
  publishers: repositoryOwner && repositoryName ? [new PublisherGithub({ repository: { owner: repositoryOwner, name: repositoryName }, prerelease: false })] : []
}

export default config
