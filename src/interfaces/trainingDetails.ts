import { TrainingDetailsMatch } from './trainingDetailsMatch'
import { TrainingDetailsScoreboard } from './trainingDetailsScoreboard'

export interface TrainingDetails {
  id: string
  date: Date,
  matches: TrainingDetailsMatch[]
  scoreboards: TrainingDetailsScoreboard[]
}
