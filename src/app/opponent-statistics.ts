import type { Match } from '../interfaces/match'
import { canonicalTeamIds, didPlayerWin, isDecidedMatch } from './match-statistics'

export interface OpponentRecord {
  ids: readonly string[]
  matches: number
  wins: number
}

export interface OpponentRankings {
  bestIndividuals: OpponentRecord[]
  toughestIndividuals: OpponentRecord[]
  bestPairs: OpponentRecord[]
  toughestPairs: OpponentRecord[]
}

function addRecord(records: Map<string, OpponentRecord>, ids: readonly string[], won: boolean): void {
  const key = JSON.stringify(ids)
  const record = records.get(key) ?? { ids, matches: 0, wins: 0 }
  record.matches++
  if (won) record.wins++
  records.set(key, record)
}

function rankings(records: Map<string, OpponentRecord>, minimumMatches: number):
  [OpponentRecord[], OpponentRecord[]] {
  const eligible = [...records.values()].filter(record => record.matches >= minimumMatches)
  const nameOrder = (a: OpponentRecord, b: OpponentRecord) =>
    JSON.stringify(a.ids).localeCompare(JSON.stringify(b.ids))
  const best = [...eligible].sort((a, b) =>
    b.wins / b.matches - a.wins / a.matches || b.matches - a.matches || nameOrder(a, b)
  ).slice(0, 3)
  const toughest = [...eligible].sort((a, b) =>
    a.wins / a.matches - b.wins / b.matches || b.matches - a.matches || nameOrder(a, b)
  ).slice(0, 3)
  return [best, toughest]
}

export function rankOpponents(
  matches: readonly Match[], playerId: string, minimumMatches = 3
): OpponentRankings {
  const individuals = new Map<string, OpponentRecord>()
  const pairs = new Map<string, OpponentRecord>()

  for (const match of matches) {
    if (!isDecidedMatch(match)) continue
    const team1 = [match.team1Player1, match.team1Player2]
    const team2 = [match.team2Player1, match.team2Player2]
    const onTeam1 = team1.includes(playerId)
    const onTeam2 = team2.includes(playerId)
    if (onTeam1 === onTeam2) continue
    const opponents = onTeam1 ? team2 : team1
    if (opponents.some(id => !id || id === playerId) || opponents[0] === opponents[1]) continue

    const won = didPlayerWin(match, playerId)
    for (const id of opponents) addRecord(individuals, [id], won)
    addRecord(pairs, canonicalTeamIds(opponents[0], opponents[1]), won)
  }

  const [bestIndividuals, toughestIndividuals] = rankings(individuals, minimumMatches)
  const [bestPairs, toughestPairs] = rankings(pairs, minimumMatches)
  return { bestIndividuals, toughestIndividuals, bestPairs, toughestPairs }
}
