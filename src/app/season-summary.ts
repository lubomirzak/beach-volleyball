import type { Match } from '../interfaces/match'
import type { Training } from '../interfaces/training'
import { isDecidedMatch } from './match-statistics'

export interface SeasonSummary {
  matches: number
  players: number
  trainings: number
}

export function summarizeSeason(matches: readonly Match[], trainings: readonly Training[]): SeasonSummary {
  const decidedMatches = matches.filter(isDecidedMatch)
  const playerIds = new Set<string>()

  for (const match of decidedMatches) {
    for (const id of [match.team1Player1, match.team1Player2, match.team2Player1, match.team2Player2]) {
      if (id) playerIds.add(id)
    }
  }

  return { matches: decidedMatches.length, players: playerIds.size, trainings: trainings.length }
}
