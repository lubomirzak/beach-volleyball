import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core'
import {
  DocumentReference,
  Firestore,
  collection,
  addDoc,
  getDocs,
  DocumentData,
  query,
} from '@angular/fire/firestore'
import { Match } from 'src/interfaces/match'
import { SeasonService } from './season.service'
import { CacheService } from './cache.service'

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  collectionName: string
  constructor(
    private firestore: Firestore,
    seasonService: SeasonService,
    private cacheService: CacheService,
    private injector: EnvironmentInjector
  ) {
        this.collectionName = 'matches' + seasonService.getSuffix();
  }

  getMatchesForTraining = async (trainingId: string): Promise<Match[]> => {
    const matches = await this.getAllMatches()
    return matches.filter(match => match.trainingId === trainingId)
  }

  getAllMatches = (matchCollection: string = this.collectionName): Promise<Match[]> =>
    this.cacheService.getOrLoad(`matches:${matchCollection}`, async () => {
      const result: Match[] = []
      const snapshot = await runInInjectionContext(this.injector, () => {
        const matchesRef = collection(this.firestore, matchCollection)
        return getDocs(query(matchesRef))
      })
      snapshot.forEach((doc) => {
        const item = doc.data()
        result.push({
          id: item['id'],
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
        addDoc(collection(this.firestore, this.collectionName), match)
      )
      this.cacheService.clear(`matches:${this.collectionName}`)
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
