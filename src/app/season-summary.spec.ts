import type { Match } from '../interfaces/match'
import { summarizeSeason } from './season-summary'

describe('summarizeSeason', () => {
  it('counts decided matches and distinct players within the selected season', () => {
    const first: Match = {
      id: '1', trainingId: 'training-1', created: 1,
      team1Player1: 'a', team1Player2: 'b', team2Player1: 'c', team2Player2: 'd',
      team1Points: 21, team2Points: 18,
    }
    const second: Match = {
      ...first, id: '2', trainingId: 'training-2',
      team1Player1: 'a', team1Player2: 'e', team2Player1: 'd', team2Player2: 'f',
      team1Points: 19, team2Points: 21,
    }
    const tied: Match = { ...first, id: '3', team1Player1: 'g', team1Points: 20, team2Points: 20 }

    expect(summarizeSeason([first, second, tied], [
      { id: 'training-1', date: new Date(2026, 1, 1) },
      { id: 'training-2', date: new Date(2026, 1, 8) },
    ])).toEqual({ matches: 2, players: 6, trainings: 2 })
  })
})
