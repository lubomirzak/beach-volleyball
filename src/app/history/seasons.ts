export interface HistorySeason {
  slug: string
  label: string
  matchesCollection: string
  current: boolean
}

export const HISTORY_SEASONS: readonly HistorySeason[] = [
  { slug: 'winter-2026', label: 'Winter 2026', matchesCollection: 'matches_W2026', current: true },
  { slug: 'summer-2026', label: 'Summer 2026', matchesCollection: 'matches_S2026', current: false },
  { slug: 'winter-2025', label: 'Winter 2025', matchesCollection: 'matches_W2025', current: false },
  { slug: 'summer-2025', label: 'Summer 2025', matchesCollection: 'matches', current: false },
]
