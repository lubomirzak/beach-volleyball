export interface SubstitutePayment {
  playerId: string
  trainingId: string
  seasonId: string
  amount: number
  paid: boolean
  created: number
}

export interface SubstitutePaymentRow extends SubstitutePayment {
  firestoreId: string
  playerName: string
  trainingDate: Date | null
}
