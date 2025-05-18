import { Match } from "./match";

export interface TrainingDetailsMatch extends Match {
  id: string
  team1: string,
  team2: string,
  score: string
}
