import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core'
import {
  DocumentReference,
  Firestore,
  collection,
  addDoc,
  getDocs,
  DocumentData,
} from '@angular/fire/firestore'
import { Player } from 'src/interfaces/player'
import { CacheService } from './cache.service'

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  constructor(
    private firestore: Firestore,
    private cacheService: CacheService,
    private injector: EnvironmentInjector
  ) {}

  get = (): Promise<Player[]> => this.cacheService.getOrLoad('players', async () => {
    const result: Player[] = []
    const snapshot = await runInInjectionContext(this.injector, () =>
      getDocs(collection(this.firestore, 'players'))
    )
    snapshot.forEach((doc) => {
      const item = doc.data()
      result.push({
        id: item['id'],
        firstName: item['firstName'],
        lastName: item['lastName'],
      })
    })
    return result.sort((a, b) =>
      a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
    )
  })

  create = async (
    firstName: string,
    lastName: string
  ): Promise<void | DocumentReference<DocumentData>> => {
    const player: Player = {
      id: this.generateGUID(),
      firstName: firstName,
      lastName: lastName,
    }

    try {
      const newMessageRef = await runInInjectionContext(this.injector, () =>
        addDoc(collection(this.firestore, 'players'), player)
      )
      this.cacheService.clear('players')
      return newMessageRef
    } catch (error) {
      console.error('Error writing new player to Firebase Database', error)
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
