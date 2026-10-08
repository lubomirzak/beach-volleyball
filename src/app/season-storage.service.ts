import { Injectable } from '@angular/core'
import { HISTORY_SEASONS } from './history/seasons'

export type SeasonEntity = 'matches' | 'trainings' | 'fines' | 'substitutePayments'

export const SHARED_COLLECTIONS: Record<SeasonEntity, string> = {
  matches: 'seasonMatches',
  trainings: 'seasonTrainings',
  fines: 'seasonFines',
  substitutePayments: 'seasonSubstitutePayments',
}

@Injectable({ providedIn: 'root' })
export class SeasonStorageService {
  get currentSeasonId(): string {
    return HISTORY_SEASONS.find(season => season.current)!.slug
  }
}
