import type { Match } from '../interfaces/match'
import { rankOpponents } from './opponent-statistics'

function match(id: string, team1: [string, string], team2: [string, string], score: [number, number]): Match {
  return {
    id, trainingId: 'training', created: 1,
    team1Player1: team1[0], team1Player2: team1[1],
    team2Player1: team2[0], team2Player2: team2[1],
    team1Points: score[0], team2Points: score[1],
  }
}

describe('rankOpponents', () => {
  it('counts both opposing players and the same pair across swapped slots and sides', () => {
    const matches = [
      match('1', ['a', 'b'], ['c', 'd'], [21, 15]),
      match('2', ['d', 'c'], ['b', 'a'], [21, 18]),
      match('3', ['a', 'b'], ['d', 'c'], [21, 14]),
      match('4', ['a', 'b'], ['e', 'f'], [17, 21]),
      match('5', ['f', 'e'], ['a', 'b'], [21, 12]),
      match('6', ['a', 'b'], ['f', 'e'], [18, 21]),
      match('7', ['a', 'b'], ['g', 'h'], [21, 12]),
      match('tie', ['a', 'b'], ['e', 'f'], [20, 20]),
    ]
    const result = rankOpponents(matches, 'a')
    expect(result.bestIndividuals.map(record => record.ids)).toEqual([['c'], ['d'], ['e']])
    expect(result.toughestIndividuals.map(record => record.ids)).toEqual([['e'], ['f'], ['c']])
    expect(result.bestPairs).toEqual([
      { ids: ['c', 'd'], matches: 3, wins: 2 },
      { ids: ['e', 'f'], matches: 3, wins: 0 },
    ])
    expect(result.toughestPairs.map(record => record.ids)).toEqual([['e', 'f'], ['c', 'd']])
  })

  it('shows only opponents with at least three matches, even when the list is short', () => {
    const matches = [
      match('1', ['a', 'b'], ['c', 'd'], [21, 15]),
      match('2', ['a', 'b'], ['c', 'd'], [21, 15]),
      match('3', ['a', 'b'], ['c', 'd'], [15, 21]),
    ]
    const result = rankOpponents(matches, 'a')
    expect(result.bestIndividuals.map(record => record.ids)).toEqual([['c'], ['d']])
    expect(result.toughestIndividuals.map(record => record.ids)).toEqual([['c'], ['d']])
    expect(result.bestPairs).toEqual([{ ids: ['c', 'd'], matches: 3, wins: 2 }])
    expect(result.toughestPairs).toEqual(result.bestPairs)
  })

  it('applies the three-match minimum separately to each season', () => {
    const winter = [
      match('w1', ['a', 'b'], ['c', 'd'], [21, 15]),
      match('w2', ['a', 'b'], ['c', 'd'], [15, 21]),
    ]
    const summer = [match('s1', ['d', 'c'], ['b', 'a'], [15, 21])]

    expect(rankOpponents(winter, 'a').bestPairs).toEqual([])
    expect(rankOpponents(summer, 'a').bestPairs).toEqual([])
    expect(rankOpponents([...winter, ...summer], 'a').bestPairs)
      .toEqual([{ ids: ['c', 'd'], matches: 3, wins: 2 }])
  })

  it('can require five meetings for the all-season rankings', () => {
    const matches = [
      match('1', ['a', 'b'], ['c', 'd'], [21, 15]),
      match('2', ['a', 'b'], ['c', 'd'], [21, 15]),
      match('3', ['a', 'b'], ['c', 'd'], [15, 21]),
      match('4', ['a', 'b'], ['c', 'd'], [21, 15]),
    ]
    expect(rankOpponents(matches, 'a').bestPairs.length).toBe(1)
    expect(rankOpponents(matches, 'a', 5).bestPairs).toEqual([])
    const fifth = match('5', ['a', 'b'], ['c', 'd'], [21, 15])
    expect(rankOpponents([...matches, fifth], 'a', 5).bestPairs)
      .toEqual([{ ids: ['c', 'd'], matches: 5, wins: 4 }])
  })
})
