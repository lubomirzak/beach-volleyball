import type { Match } from '../interfaces/match'
import type { Player } from '../interfaces/player'
import {
  buildScoreboards, buildTeams, canonicalTeamIds, didPlayerWin,
  isDecidedMatch, partnerIdForMatch, winRatio,
} from './match-statistics'

const players: Player[] = [
  { id: 'a', firstName: 'Alice', lastName: 'Adams' },
  { id: 'b', firstName: 'Bob', lastName: 'Brown' },
  { id: 'c', firstName: 'Cara', lastName: 'Clark' },
  { id: 'd', firstName: 'Dan', lastName: 'Davis' },
]

function match(id: string, team1: [string, string], team2: [string, string], score: [number, number]): Match {
  return {
    id,
    trainingId: 'training-1',
    team1Player1: team1[0],
    team1Player2: team1[1],
    team2Player1: team2[0],
    team2Player2: team2[1],
    team1Points: score[0],
    team2Points: score[1],
    created: 1,
  }
}

const matches = [
  match('1', ['a', 'b'], ['c', 'd'], [21, 15]),
  match('2', ['b', 'a'], ['d', 'c'], [14, 21]),
  match('3', ['c', 'd'], ['a', 'b'], [15, 21]),
]

describe('match statistics', () => {
  it('finds partners and wins in either slot and on either side', () => {
    expect(canonicalTeamIds('b', 'a')).toEqual(['a', 'b'])
    expect(partnerIdForMatch(matches[0], 'a')).toBe('b')
    expect(partnerIdForMatch(matches[1], 'a')).toBe('b')
    expect(partnerIdForMatch(matches[2], 'a')).toBe('b')
    expect(partnerIdForMatch(matches[2], 'd')).toBe('c')
    expect(partnerIdForMatch(matches[0], 'missing')).toBeNull()
    expect(didPlayerWin(matches[0], 'b')).toBeTrue()
    expect(didPlayerWin(matches[1], 'a')).toBeFalse()
    expect(didPlayerWin(matches[2], 'a')).toBeTrue()
    expect(didPlayerWin(matches[0], 'missing')).toBeFalse()
  })

  it('combines teams across swapped slots and match sides', () => {
    const teams = buildTeams(matches, players)
    expect(teams.length).toBe(2)
    expect(teams.map(team => team.setsPlayed)).toEqual([3, 3])
    expect(teams.find(team => team.player1Id === 'a')?.player2Id).toBe('b')

    const [individuals, pairs] = buildScoreboards(matches, players)
    expect(pairs.length).toBe(2)
    const ab = pairs.find(team => team.player1Id === 'a' && team.player2Id === 'b')
    expect(ab?.sets).toBe('2:1')
    expect(ab?.points).toBe('56:51')
    expect(ab?.ratio).toBe('0.67')

    const alice = individuals.find(player => player.playerId === 'a')
    expect(alice?.sets).toBe('2:1')
    expect(alice?.points).toBe('56:51')
    expect(alice?.ratio).toBe('0.67')

    const cd = pairs.find(team => team.player1Id === 'c' && team.player2Id === 'd')
    expect(cd?.sets).toBe('1:2')
    expect(cd?.points).toBe('51:56')
    expect(cd?.ratio).toBe('0.33')
  })

  it('excludes undecided or invalid scores from ratios', () => {
    const tied = match('tie', ['a', 'b'], ['c', 'd'], [15, 15])
    const negative = match('negative', ['a', 'b'], ['c', 'd'], [-1, 21])
    expect(isDecidedMatch(tied)).toBeFalse()
    expect(isDecidedMatch(negative)).toBeFalse()
    expect(didPlayerWin(tied, 'a')).toBeFalse()
    expect(buildTeams([tied, negative], players)).toEqual([])
    expect(buildScoreboards([tied, negative], players)).toEqual([[], []])
    expect(winRatio(2, 1)).toBe(2 / 3)
    expect(winRatio(0, 0)).toBe(0)
  })
})
