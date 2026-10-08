import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core'
import { Firestore, collection, doc, getDoc, getDocs, query, setDoc, where } from '@angular/fire/firestore'
import { SHARED_COLLECTIONS } from './season-storage.service'

const PUBLIC_SEASON_STATS = 'publicSeasonStats'

@Injectable({ providedIn: 'root' })
export class SeasonFineTotalService {
  constructor(private firestore: Firestore, private injector: EnvironmentInjector) {}

  async get(seasonId: string): Promise<number | null> {
    const snapshot = await runInInjectionContext(this.injector, () =>
      getDoc(doc(this.firestore, PUBLIC_SEASON_STATS, seasonId))
    )
    return snapshot.exists() ? snapshot.data()['fineTotalCents'] as number : null
  }

  // Only the admin can read all fine documents and publish their combined amount.
  async refresh(seasonId: string): Promise<number> {
    const snapshot = await runInInjectionContext(this.injector, () =>
      getDocs(query(collection(this.firestore, SHARED_COLLECTIONS.fines), where('seasonId', '==', seasonId)))
    )
    const fineTotalCents = snapshot.docs.reduce(
      (total, fine) => total + Math.round(Number(fine.data()['amount']) * 100), 0
    )
    const current = await this.get(seasonId)
    if (current !== fineTotalCents) {
      await runInInjectionContext(this.injector, () =>
        setDoc(doc(this.firestore, PUBLIC_SEASON_STATS, seasonId),
          { fineTotalCents, updatedAt: Date.now() })
      )
    }
    return fineTotalCents
  }
}
