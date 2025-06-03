import { Fine } from './fine'

export interface FineDetails extends Fine {
  playerName: string
  date: Date
  amountString: string
}
