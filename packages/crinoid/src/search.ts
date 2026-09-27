const CONSECUTIVE_BONUS = 8
const GAP_PENALTY = 1
const START_PENALTY = 0.1

export function fuzzyScore(query: string, text: string): number {
  const needle = query.trim().toLowerCase()
  if (!needle) return 0
  const haystack = text.toLowerCase()
  let score = 0
  let previous = -2
  let index = -1
  for (const character of needle) {
    const found = haystack.indexOf(character, index + 1)
    if (found === -1) return -1
    score += 1
    if (found === previous + 1) score += CONSECUTIVE_BONUS
    score -= (found - index - 1) * GAP_PENALTY
    previous = found
    index = found
  }
  return score - index * START_PENALTY
}

export interface RankOptions<T> {
  readonly keys: readonly (keyof T)[]
  readonly limit?: number
}

export function rankBy<T>(items: readonly T[], query: string, options: RankOptions<T>): readonly T[] {
  if (!query.trim()) return options.limit === undefined ? [...items] : items.slice(0, options.limit)
  const ranked = items
    .map((item, order) => ({ item, order, score: bestScore(query, item, options.keys) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .map((entry) => entry.item)
  return options.limit === undefined ? ranked : ranked.slice(0, options.limit)
}

function bestScore<T>(query: string, item: T, keys: readonly (keyof T)[]): number {
  let best = -1
  for (const key of keys) {
    const value = item[key]
    if (typeof value !== 'string') continue
    best = Math.max(best, fuzzyScore(query, value))
  }
  return best
}
