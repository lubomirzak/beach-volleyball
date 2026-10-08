import type { Match } from '../interfaces/match'
import type { Player } from '../interfaces/player'
import type { Team } from '../interfaces/team'
import type { TrainingDetailsScoreboard } from '../interfaces/trainingDetailsScoreboard'
import type { TrainingDetailsScoreboardTeam } from '../interfaces/trainingDetailsScoreboardTeam'

// A team is the same pair regardless of input position or which side it played on.
export function canonicalTeamIds(firstId: string, secondId: string): [string, string] {
  return firstId <= secondId ? [firstId, secondId] : [secondId, firstId]
}

function teamKey(firstId: string, secondId: string): string {
  return JSON.stringify(canonicalTeamIds(firstId, secondId))
}

export function winRatio(wins: number, losses: number): number {
  const matches = wins + losses
  return matches === 0 ? 0 : wins / matches
}

type LeaderboardRow = Pick<TrainingDetailsScoreboard,
  'name' | 'wonSets' | 'lostSets' | 'wonPoints' | 'lostPoints'>

// Break equal win ratios by point difference, then by points scored.
export function leaderboardRank(row: LeaderboardRow): readonly [number, number, number] {
  return [winRatio(row.wonSets, row.lostSets), row.wonPoints - row.lostPoints, row.wonPoints]
}

export function compareLeaderboardRows(left: LeaderboardRow, right: LeaderboardRow): number {
  const leftRank = leaderboardRank(left)
  const rightRank = leaderboardRank(right)
  return rightRank[0] - leftRank[0]
    || rightRank[1] - leftRank[1]
    || rightRank[2] - leftRank[2]
    || left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
}

export function isDecidedMatch(match: Match): boolean {
  return Number.isInteger(match.team1Points)
    && Number.isInteger(match.team2Points)
    && match.team1Points >= 0
    && match.team2Points >= 0
    && match.team1Points !== match.team2Points
}

export function partnerIdForMatch(match: Match, playerId: string): string | null {
  if (match.team1Player1 === playerId) return match.team1Player2
  if (match.team1Player2 === playerId) return match.team1Player1
  if (match.team2Player1 === playerId) return match.team2Player2
  if (match.team2Player2 === playerId) return match.team2Player1
  return null
}

export function didPlayerWin(match: Match, playerId: string): boolean {
  if (!isDecidedMatch(match)) return false
  if (match.team1Player1 === playerId || match.team1Player2 === playerId) {
    return match.team1Points > match.team2Points
  }
  if (match.team2Player1 === playerId || match.team2Player2 === playerId) {
    return match.team2Points > match.team1Points
  }
  return false
}

function playerName(playersById: Map<string, Player>, id: string): string {
  const player = playersById.get(id)
  return player ? `${player.firstName} ${player.lastName}` : `Unknown player (${id})`
}

function leaderboardPlayerName(playersById: Map<string, Player>, id: string): string {
  const player = playersById.get(id)
  return player ? `${player.lastName.toLocaleUpperCase()} ${player.firstName}` : `Unknown player (${id})`
}

function leaderboardPairName(playersById: Map<string, Player>, firstId: string, secondId: string): string {
  return [firstId, secondId]
    .map(id => leaderboardPlayerName(playersById, id))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .join(', ')
}

export function buildTeams(matches: readonly Match[], players: readonly Player[]): Team[] {
  const playersById = new Map(players.map(player => [player.id, player] as const))
  const teams = new Map<string, Team>()

  for (const match of matches) {
    if (!isDecidedMatch(match)) continue
    for (const [firstId, secondId] of [
      [match.team1Player1, match.team1Player2],
      [match.team2Player1, match.team2Player2],
    ]) {
      const [player1Id, player2Id] = canonicalTeamIds(firstId, secondId)
      const id = teamKey(player1Id, player2Id)
      const team = teams.get(id) ?? {
        id,
        player1Id,
        player2Id,
        player1Name: playerName(playersById, player1Id),
        player2Name: playerName(playersById, player2Id),
        setsPlayed: 0,
      }
      team.setsPlayed++
      teams.set(id, team)
    }
  }

  return [...teams.values()].sort((a, b) =>
    b.setsPlayed - a.setsPlayed || a.player1Name.localeCompare(b.player1Name)
      || a.player2Name.localeCompare(b.player2Name)
  )
}

export function buildScoreboards(
  matches: readonly Match[],
  players: readonly Player[]
): [TrainingDetailsScoreboard[], TrainingDetailsScoreboardTeam[]] {
  const playersById = new Map(players.map(player => [player.id, player] as const))
  const individuals = new Map<string, TrainingDetailsScoreboard>()
  const teams = new Map<string, TrainingDetailsScoreboardTeam>()

  function addIndividual(id: string, pointsFor: number, pointsAgainst: number, won: boolean): void {
    const row = individuals.get(id) ?? {
      playerId: id,
      name: leaderboardPlayerName(playersById, id),
      wonSets: 0,
      lostSets: 0,
      wonPoints: 0,
      lostPoints: 0,
      sets: '0:0',
      points: '0:0',
      ratio: '0.00',
    }
    row.wonSets += Number(won)
    row.lostSets += Number(!won)
    row.wonPoints += pointsFor
    row.lostPoints += pointsAgainst
    row.sets = `${row.wonSets}:${row.lostSets}`
    row.points = `${row.wonPoints}:${row.lostPoints}`
    row.ratio = winRatio(row.wonSets, row.lostSets).toFixed(2)
    individuals.set(id, row)
  }

  function addTeam(firstId: string, secondId: string, pointsFor: number, pointsAgainst: number, won: boolean): void {
    const [player1Id, player2Id] = canonicalTeamIds(firstId, secondId)
    const key = teamKey(player1Id, player2Id)
    const row = teams.get(key) ?? {
      player1Id,
      player2Id,
      name: leaderboardPairName(playersById, player1Id, player2Id),
      wonSets: 0,
      lostSets: 0,
      wonPoints: 0,
      lostPoints: 0,
      sets: '0:0',
      points: '0:0',
      ratio: '0.00',
    }
    row.wonSets += Number(won)
    row.lostSets += Number(!won)
    row.wonPoints += pointsFor
    row.lostPoints += pointsAgainst
    row.sets = `${row.wonSets}:${row.lostSets}`
    row.points = `${row.wonPoints}:${row.lostPoints}`
    row.ratio = winRatio(row.wonSets, row.lostSets).toFixed(2)
    teams.set(key, row)
  }

  for (const match of matches) {
    if (!isDecidedMatch(match)) continue
    const team1Won = match.team1Points > match.team2Points
    const team2Won = match.team2Points > match.team1Points

    for (const id of [match.team1Player1, match.team1Player2]) {
      addIndividual(id, match.team1Points, match.team2Points, team1Won)
    }
    for (const id of [match.team2Player1, match.team2Player2]) {
      addIndividual(id, match.team2Points, match.team1Points, team2Won)
    }
    addTeam(match.team1Player1, match.team1Player2, match.team1Points, match.team2Points, team1Won)
    addTeam(match.team2Player1, match.team2Player2, match.team2Points, match.team1Points, team2Won)
  }

  return [[...individuals.values()], [...teams.values()]]
}
