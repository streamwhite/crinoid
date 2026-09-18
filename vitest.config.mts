import { resolve } from 'node:path'

export default {
  resolve: { alias: { '@': resolve('src') } },
  test: { environment: 'node', globals: true }
}
