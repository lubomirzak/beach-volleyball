import { Attending } from './attending'
import { TrainingDetailsMatch } from './trainingDetailsMatch'
import { TrainingDetailsScoreboard } from './trainingDetailsScoreboard'

export interface TrainingDetails {
  id: string
  type: Attending,
  date: Date,
  matches: TrainingDetailsMatch[]
  scoreboards: TrainingDetailsScoreboard[]
}
