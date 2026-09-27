import { describe, expect, it, vi } from 'vitest'
import { createStateSync } from 'crinoid/state-sync'
import { createStore } from 'crinoid/reactive'

type Sent = { channel: string; args: unknown[] }

function createRegistry() {
  const sent: Sent[] = []
  const windows = new Map<string, { destroyed: boolean; webContents: { send(channel: string, ...args: unknown[]): void } }>()
  windows.set('main', { destroyed: false, webContents: { send: (channel, ...args) => sent.push({ channel, args }) } })
  return {
    sent,
    windows,
    registry: {
      get: (id: string) => windows.get(id),
      broadcast: (channel: string, ...args: unknown[]) => {
        let count = 0
        for (const window of windows.values()) {
          window.webContents.send(channel, ...args)
          count += 1
        }
        return count
      },
      ids: () => [...windows.keys()],
      size: () => windows.size
    }
  }
}

describe('state sync', () => {
  it('broadcasts store updates to every window', () => {
    const { registry, sent } = createRegistry()
    const store = createStore({ theme: 'light' })
    createStateSync({ store, registry, channel: 'state.changed' })

    store.set({ theme: 'dark' })

    expect(sent).toEqual([{ channel: 'state.changed', args: [{ theme: 'dark' }] }])
  })

  it('emits the initial state to a newly opened window', () => {
    const { registry, sent } = createRegistry()
    const store = createStore({ theme: 'light' })
    const sync = createStateSync({ store, registry, channel: 'state.changed' })
    sent.length = 0

    sync.emitTo('main')

    expect(sent).toEqual([{ channel: 'state.changed', args: [{ theme: 'light' }] }])
  })

  it('stops broadcasting after dispose', () => {
    const { registry, sent } = createRegistry()
    const store = createStore(0)
    const sync = createStateSync({ store, registry, channel: 'state.changed' })

    sync.dispose()
    store.set(1)

    expect(sent).toEqual([])
  })

  it('subscribes a renderer bridge and forwards updates', () => {
    const store = createStore({ count: 0 })
    const received: unknown[] = []
    const unsubscribe = store.subscribe((value) => received.push(value))

    store.set({ count: 5 })

    expect(received).toEqual([{ count: 5 }])
    unsubscribe()
  })
})
