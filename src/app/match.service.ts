import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core'
import {
  DocumentReference,
  Firestore,
  collection,
  addDoc,
  getDocs,
  DocumentData,
  query,
  where,
  doc,
  deleteDoc,
} from '@angular/fire/firestore'
import { Match } from 'src/interfaces/match'
import { CacheService } from './cache.service'
import { SHARED_COLLECTIONS, SeasonStorageService } from './season-storage.service'

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  constructor(
    private firestore: Firestore,
    private cacheService: CacheService,
    private injector: EnvironmentInjector,
    private seasonStorage: SeasonStorageService
  ) {}

  getMatchesForTraining = async (trainingId: string): Promise<Match[]> => {
    const matches = await this.getAllMatches()
    return matches.filter(match => match.trainingId === trainingId)
  }

  getAllMatches = async (seasonId: string = this.seasonStorage.currentSeasonId): Promise<Match[]> => {
    return this.cacheService.getOrLoad(`matches:${seasonId}`, async () => {
      const result: Match[] = []
      const snapshot = await runInInjectionContext(this.injector, () => {
        const matchesRef = collection(this.firestore, SHARED_COLLECTIONS.matches)
        return getDocs(query(matchesRef, where('seasonId', '==', seasonId)))
      })
      snapshot.forEach((doc) => {
        const item = doc.data()
        result.push({
          id: item['id'],
          firestoreId: doc.id,
          trainingId: item['trainingId'] ?? 'UNKNOWN',
          team1Player1: item['team1Player1'],
          team1Player2: item['team1Player2'],
          team2Player1: item['team2Player1'],
          team2Player2: item['team2Player2'],
          team1Points: item['team1Points'],
          team2Points: item['team2Points'],
          created: item['created'],
        })
      })
      return result
    })
  }

  deleteMatch = async (firestoreId: string): Promise<void> => {
    if (!firestoreId) throw new Error('Match document ID is missing.')

    await runInInjectionContext(this.injector, () =>
      deleteDoc(doc(this.firestore, SHARED_COLLECTIONS.matches, firestoreId))
    )
    this.cacheService.clear(`matches:${this.seasonStorage.currentSeasonId}`)
  }

  create = async (
    trainingId: string,
    team1Player1: string,
    team1Player2: string,
    team2Player1: string,
    team2Player2: string,
    team1Points: number,
    team2Points: number
  ): Promise<void | DocumentReference<DocumentData>> => {
    const match: Match = {
      id: this.generateGUID(),
      trainingId: trainingId,
      team1Player1: team1Player1,
      team1Player2: team1Player2,
      team2Player1: team2Player1,
      team2Player2: team2Player2,
      team1Points: team1Points,
      team2Points: team2Points,
      created: Date.now(),
    }

    try {
      const newMessageRef = await runInInjectionContext(this.injector, () =>
        addDoc(collection(this.firestore, SHARED_COLLECTIONS.matches),
          { ...match, seasonId: this.seasonStorage.currentSeasonId })
      )
      this.cacheService.clear(`matches:${this.seasonStorage.currentSeasonId}`)
      return newMessageRef
    } catch (error) {
      console.error('Error writing new match to Firebase Database', error)
      return
    }
  }

  // Naive implementation, but it's enough
  generateGUID(): string {
    const timestamp = new Date().getTime()
    const randomNum = Math.floor(Math.random() * 1000000)
    return `${timestamp}-${randomNum}`
  }
}
