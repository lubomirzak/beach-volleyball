import { Sort } from '@angular/material/sort'
import { leaderboardRank } from './match-statistics'

export type TableSortValue = string | number | Date | readonly (string | number)[] | null | undefined

function compareValues(left: TableSortValue, right: TableSortValue): number {
  if (left == null || right == null) return left == null ? (right == null ? 0 : -1) : 1
  if (left instanceof Date) left = left.getTime()
  if (right instanceof Date) right = right.getTime()
  if (Array.isArray(left) && Array.isArray(right)) {
    for (let index = 0; index < Math.min(left.length, right.length); index++) {
      const result = compareValues(left[index], right[index])
      if (result) return result
    }
    return left.length - right.length
  }
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right), undefined, { sensitivity: 'base', numeric: true })
}

export function sortTableRows<T extends object>(
  rows: readonly T[],
  sort: Sort,
  valueFor: (row: T, column: string) => TableSortValue = (row, column) =>
    (row as Record<string, TableSortValue>)[column]
): T[] {
  if (!sort.active || !sort.direction) return [...rows]
  const direction = sort.direction === 'asc' ? 1 : -1
  return rows.map((row, index) => ({ row, index })).sort((left, right) =>
    compareValues(valueFor(left.row, sort.active), valueFor(right.row, sort.active)) * direction
      || left.index - right.index
  ).map(item => item.row)
}

interface ScoreboardRow {
  name: string
  wonSets: number
  lostSets: number
  wonPoints: number
  lostPoints: number
}

export function scoreboardSortValue(row: ScoreboardRow, column: string): TableSortValue {
  switch (column) {
    case 'sets': return [row.wonSets, row.lostSets]
    case 'points': return [row.wonPoints, row.lostPoints]
    case 'ratio': return leaderboardRank(row)
    default: return row.name
  }
}
