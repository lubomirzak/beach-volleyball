import { scoreboardSortValue, sortTableRows } from './table-sort'

describe('table sorting', () => {
  it('keeps the original order until a header is selected', () => {
    const rows = [{ name: 'Zoe' }, { name: 'Adam' }]
    expect(sortTableRows(rows, { active: '', direction: '' })).toEqual(rows)
    expect(sortTableRows(rows, { active: 'name', direction: 'asc' }).map(row => row.name))
      .toEqual(['Adam', 'Zoe'])
    expect(sortTableRows(rows, { active: 'name', direction: 'desc' }).map(row => row.name))
      .toEqual(['Zoe', 'Adam'])
    expect(rows.map(row => row.name)).toEqual(['Zoe', 'Adam'])
  })

  it('compares dates and counts as values', () => {
    const rows = [
      { date: new Date(2026, 0, 10), matches: 10 },
      { date: new Date(2025, 11, 31), matches: 2 },
    ]
    expect(sortTableRows(rows, { active: 'date', direction: 'asc' })[0].matches).toBe(2)
    expect(sortTableRows(rows, { active: 'matches', direction: 'asc' })[0].matches).toBe(2)
  })

  it('sorts scoreboard ratios and paired scores numerically', () => {
    const rows = [
      { name: 'A', wonSets: 2, lostSets: 1, wonPoints: 9, lostPoints: 2 },
      { name: 'B', wonSets: 1, lostSets: 1, wonPoints: 21, lostPoints: 15 },
    ]
    expect(sortTableRows(rows, { active: 'ratio', direction: 'desc' }, scoreboardSortValue)[0].name)
      .toBe('A')
    expect(sortTableRows(rows, { active: 'points', direction: 'asc' }, scoreboardSortValue)[0].name)
      .toBe('A')
  })

  it('uses point difference to break ratio ties when sorting a leaderboard', () => {
    const rows = [
      { name: 'A', wonSets: 2, lostSets: 1, wonPoints: 60, lostPoints: 55 },
      { name: 'B', wonSets: 4, lostSets: 2, wonPoints: 80, lostPoints: 71 },
    ]
    expect(sortTableRows(rows, { active: 'ratio', direction: 'desc' }, scoreboardSortValue)
      .map(row => row.name)).toEqual(['B', 'A'])
    expect(sortTableRows(rows, { active: 'ratio', direction: 'asc' }, scoreboardSortValue)
      .map(row => row.name)).toEqual(['A', 'B'])
  })
})
