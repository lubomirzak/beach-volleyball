import { Fine } from './fine'

export interface FineDetails extends Fine {
  firestoreId: string
  playerName: string
  date: Date
}
