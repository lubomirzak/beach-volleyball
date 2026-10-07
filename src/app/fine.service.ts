import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core'
import {
  DocumentReference,
  Firestore,
  collection,
  addDoc,
  getDocs,
  DocumentData,
} from '@angular/fire/firestore'
import { FineDetails } from 'src/interfaces/fineDetails'
import { CacheService } from './cache.service'
import { SeasonService } from './season.service'
import { PlayerService } from './player.service'
import { TrainingService } from './training.service'
import { Fine } from 'src/interfaces/fine'

@Injectable({
  providedIn: 'root',
})
export class FineService {
  collectionName: string
  constructor(
    private firestore: Firestore,
    private cacheService: CacheService,
    private playerService: PlayerService,
    private trainingService: TrainingService,
    seasonService: SeasonService,
    private injector: EnvironmentInjector
  ) {
    this.collectionName = 'fines' + seasonService.getSuffix();
  }

  get = (): Promise<FineDetails[]> =>
    this.cacheService.getOrLoad(`fines:${this.collectionName}`, async () => {
      const result: FineDetails[] = []
      const [playersData, trainingsData] = await Promise.all([
        this.playerService.get(),
        this.trainingService.get(),
      ])
      const snapshot = await runInInjectionContext(this.injector, () =>
        getDocs(collection(this.firestore, this.collectionName))
      )
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
        addDoc(collection(this.firestore, this.collectionName), fine)
      )
      this.cacheService.clear(`fines:${this.collectionName}`)
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
