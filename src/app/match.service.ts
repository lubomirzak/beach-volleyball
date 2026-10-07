import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core'
import {
  DocumentReference,
  Firestore,
  collection,
  addDoc,
  getDocs,
  DocumentData,
  where,
  query,
} from '@angular/fire/firestore'
import { Match } from 'src/interfaces/match'
import { SeasonService } from './season.service'

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  collectionName: string
  constructor(
    private firestore: Firestore,
    seasonService: SeasonService,
    private injector: EnvironmentInjector
  ) {
        this.collectionName = 'matches' + seasonService.getSuffix();
  }

  getMatchesForTraining = async (trainingId: string): Promise<Match[]> => {
    let result: Match[] = []

    const snapshot = await runInInjectionContext(this.injector, () => {
      const matchesRef = collection(this.firestore, this.collectionName)
      const queryRef = query(matchesRef, where('trainingId', '==', trainingId))
      return getDocs(queryRef)
    })
    snapshot.forEach((doc) => {
      let item = doc.data()

      let match: Match = {
        id: item['id'],
        trainingId: trainingId,
        team1Player1: item['team1Player1'],
        team1Player2: item['team1Player2'],
        team2Player1: item['team2Player1'],
        team2Player2: item['team2Player2'],
        team1Points: item['team1Points'],
        team2Points: item['team2Points'],
        created: item['created'],
      }

      result.push(match)
    })

    return result
  }

  getAllMatches = async (matchCollection: string = this.collectionName): Promise<Match[]> => {
    let result: Match[] = []

    const snapshot = await runInInjectionContext(this.injector, () => {
      const matchesRef = collection(this.firestore, matchCollection)
      return getDocs(query(matchesRef))
    })
    snapshot.forEach((doc) => {
      let item = doc.data()

      let match: Match = {
        id: item['id'],
        trainingId: item['trainingId'] ?? 'UNKNOWN',
        team1Player1: item['team1Player1'],
        team1Player2: item['team1Player2'],
        team2Player1: item['team2Player1'],
        team2Player2: item['team2Player2'],
        team1Points: item['team1Points'],
        team2Points: item['team2Points'],
        created: item['created'],
      }

      result.push(match)
    })

    return result
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
        addDoc(collection(this.firestore, this.collectionName), match)
      )
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
