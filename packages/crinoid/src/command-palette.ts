import { fuzzyScore } from './search.js'

export interface Command {
  readonly id: string
  readonly title: string
  readonly keywords?: readonly string[] | undefined
  readonly group?: string | undefined
  run(): void | Promise<void>
}

export interface CommandRegistry {
  register(command: Command): () => void
  unregister(id: string): void
  list(): readonly Command[]
  search(query: string): readonly Command[]
  run(id: string): Promise<boolean>
}

const DEFAULT_SEARCH_LIMIT = 20

function score(command: Command, query: string): number {
  const candidates = [command.title, ...(command.keywords ?? []), ...(command.group === undefined ? [] : [command.group])]
  let best = -1
  for (const candidate of candidates) best = Math.max(best, fuzzyScore(query, candidate))
  return best
}

export function createCommandRegistry(initial: readonly Command[] = []): CommandRegistry {
  const commands = new Map<string, Command>()
  for (const command of initial) commands.set(command.id, command)

  return {
    register: (command) => {
      commands.set(command.id, command)
      return () => commands.delete(command.id)
    },
    unregister: (id) => {
      commands.delete(id)
    },
    list: () => [...commands.values()],
    search: (query) => {
      if (!query.trim()) return [...commands.values()].slice(0, DEFAULT_SEARCH_LIMIT)
      return [...commands.values()]
        .map((command, order) => ({ command, order, score: score(command, query) }))
        .filter((entry) => entry.score >= 0)
        .sort((left, right) => right.score - left.score || left.order - right.order)
        .slice(0, DEFAULT_SEARCH_LIMIT)
        .map((entry) => entry.command)
    },
    run: async (id) => {
      const command = commands.get(id)
      if (!command) return false
      await command.run()
      return true
    }
  }
}
