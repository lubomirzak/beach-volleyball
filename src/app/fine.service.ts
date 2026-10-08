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
} from '@angular/fire/firestore'
import { FineDetails } from 'src/interfaces/fineDetails'
import { CacheService } from './cache.service'
import { PlayerService } from './player.service'
import { TrainingService } from './training.service'
import { Fine } from 'src/interfaces/fine'
import { SHARED_COLLECTIONS, SeasonStorageService } from './season-storage.service'

@Injectable({
  providedIn: 'root',
})
export class FineService {
  constructor(
    private firestore: Firestore,
    private cacheService: CacheService,
    private playerService: PlayerService,
    private trainingService: TrainingService,
    private injector: EnvironmentInjector,
    private seasonStorage: SeasonStorageService
  ) {}

  get = async (): Promise<FineDetails[]> => {
    const seasonId = this.seasonStorage.currentSeasonId
    return this.cacheService.getOrLoad(`fines:${seasonId}`, async () => {
      const result: FineDetails[] = []
      const [playersData, trainingsData] = await Promise.all([
        this.playerService.get(),
        this.trainingService.get(),
      ])
      const snapshot = await runInInjectionContext(this.injector, () => {
        const fineRef = collection(this.firestore, SHARED_COLLECTIONS.fines)
        return getDocs(query(fineRef, where('seasonId', '==', seasonId)))
      })
      snapshot.forEach((doc) => {
        const item = doc.data()
        const player = playersData.filter((p) => p.id == item['playerId'])[0]
        const training = trainingsData.filter((p) => p.id == item['trainingId'])[0]
        result.push({
          id: item['id'],
          playerName: `${player.firstName} ${player.lastName}`,
          amount: item['amount'],
          amountString: `${item['amount']} EUR`,
          created: item['created'],
          trainingId: item['trainingId'],
          playerId: item['playerId'],
          date: training.date,
        })
      })
      return result.sort((a, b) =>
        b.created.toString().localeCompare(a.created.toString())
      )
    })
  }

  create = async (
    playerId: string,
    trainingId: string,
    amount: number
  ): Promise<void | DocumentReference<DocumentData>> => {
    const fine: Fine = {
      id: this.generateGUID(),
      playerId: playerId,
      amount: amount,
      trainingId: trainingId,
      created: Date.now(),
    }

    try {
      const newMessageRef = await runInInjectionContext(this.injector, () =>
        addDoc(collection(this.firestore, SHARED_COLLECTIONS.fines),
          { ...fine, seasonId: this.seasonStorage.currentSeasonId })
      )
      this.cacheService.clear(`fines:${this.seasonStorage.currentSeasonId}`)
      return newMessageRef
    } catch (error) {
      console.error('Error writing new fine to Firebase Database', error)
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
