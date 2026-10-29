export interface TrainingDetailsScoreboardTeam {
  player1Id: string,
  player2Id: string,
  members: [{ id: string, name: string }, { id: string, name: string }],
  name: string
  wonSets: number,
  lostSets: number,
  wonPoints: number,
  lostPoints: number,
  sets: string,
  points: string,
  ratio: string
}
