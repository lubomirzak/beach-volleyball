import { inject, Injectable } from '@angular/core'
import {
  DocumentReference,
  Firestore,
  collection,
  addDoc,
  getDocs,
  DocumentData,
} from '@angular/fire/firestore'
import { Player } from 'src/interfaces/player'
import { Attending } from 'src/interfaces/attending'
import { CacheService } from './cache.service'

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  firestore: Firestore = inject(Firestore)
  cacheService = inject(CacheService)

  get = async (): Promise<Player[]> => {
    let result: Player[] = []

    let playersFromCache = this.cacheService.get('players')
    if (playersFromCache.length != 0) {
      return playersFromCache
    }

    const snapshot = await getDocs(collection(this.firestore, 'players'))
    snapshot.forEach((doc) => {
      let item = doc.data()
      let player: Player = {
        id: item['id'],
        attending: item['attending'],
        firstName: item['firstName'],
        lastName: item['lastName'],
      }

      result.push(player)
    })

    return result.sort((a, b) =>
      a.attending.toString().localeCompare(b.attending.toString())
    )
  }

  create = async (
    firstName: string,
    lastName: string,
    attending: Attending
  ): Promise<void | DocumentReference<DocumentData>> => {
    const player: Player = {
      id: this.generateGUID(),
      firstName: firstName,
      lastName: lastName,
      attending: attending,
    }

    try {
      const newMessageRef = await addDoc(
        collection(this.firestore, 'players'),
        player
      )
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
