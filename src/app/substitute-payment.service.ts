import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core'
import { Firestore, collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from '@angular/fire/firestore'
import { SubstitutePayment, SubstitutePaymentRow } from 'src/interfaces/substitutePayment'
import { CacheService } from './cache.service'
import { PlayerService } from './player.service'
import { SHARED_COLLECTIONS, SeasonStorageService } from './season-storage.service'
import { TrainingService } from './training.service'

@Injectable({ providedIn: 'root' })
export class SubstitutePaymentService {
  constructor(
    private firestore: Firestore,
    private injector: EnvironmentInjector,
    private cacheService: CacheService,
    private playerService: PlayerService,
    private trainingService: TrainingService,
    private seasonStorage: SeasonStorageService
  ) {}

  get(): Promise<SubstitutePaymentRow[]> {
    const seasonId = this.seasonStorage.currentSeasonId
    return this.cacheService.getOrLoad(`substitutePayments:${seasonId}`, async () => {
      const [players, trainings, snapshot] = await Promise.all([
        this.playerService.get(),
        this.trainingService.get(),
        runInInjectionContext(this.injector, () =>
          getDocs(query(collection(this.firestore, SHARED_COLLECTIONS.substitutePayments),
            where('seasonId', '==', seasonId)))
        ),
      ])
      const playersById = new Map(players.map(player => [player.id, player] as const))
      const trainingsById = new Map(trainings.map(training => [training.id, training] as const))
      return snapshot.docs.map(document => {
        const payment = document.data() as SubstitutePayment
        const player = playersById.get(payment.playerId)
        return {
          ...payment,
          firestoreId: document.id,
          playerName: player
            ? `${player.lastName.toLocaleUpperCase()} ${player.firstName}`
            : 'Unknown player',
          trainingDate: trainingsById.get(payment.trainingId)?.date ?? null,
        }
      }).sort((a, b) =>
        (b.trainingDate?.getTime() ?? 0) - (a.trainingDate?.getTime() ?? 0)
          || a.playerName.localeCompare(b.playerName)
      )
    })
  }

  async create(playerId: string, trainingId: string, amount: number): Promise<void> {
    const seasonId = this.seasonStorage.currentSeasonId
    const payment: SubstitutePayment = {
      playerId,
      trainingId,
      seasonId,
      amount,
      paid: false,
      created: Date.now(),
    }
    const firestoreId = `${seasonId}_${trainingId}_${playerId}`
    await runInInjectionContext(this.injector, () =>
      setDoc(doc(this.firestore, SHARED_COLLECTIONS.substitutePayments, firestoreId), payment)
    )
    this.cacheService.clear(`substitutePayments:${seasonId}`)
  }

  async setPaid(firestoreId: string, paid: boolean): Promise<void> {
    await runInInjectionContext(this.injector, () =>
      updateDoc(doc(this.firestore, SHARED_COLLECTIONS.substitutePayments, firestoreId), { paid })
    )
    this.cacheService.clear(`substitutePayments:${this.seasonStorage.currentSeasonId}`)
  }

  async delete(firestoreId: string): Promise<void> {
    await runInInjectionContext(this.injector, () =>
      deleteDoc(doc(this.firestore, SHARED_COLLECTIONS.substitutePayments, firestoreId))
    )
    this.cacheService.clear(`substitutePayments:${this.seasonStorage.currentSeasonId}`)
  }
}
