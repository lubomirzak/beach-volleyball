import { Injectable } from '@angular/core'
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
import * as CryptoJS from 'crypto-js'

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  constructor(
    private firestore: Firestore,
    private cacheService: CacheService
  ) {}

  get = async (): Promise<Player[]> => {
    let result: Player[] = []

    let playersFromCache = this.cacheService.get('players')
    if (playersFromCache.length != 0) {
      console.log('Returning players from cache')
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
    password: string,
    attending: Attending
  ): Promise<void | DocumentReference<DocumentData>> => {
    // verify password
    if (
      CryptoJS.SHA1(password).toString() !=
      '738ad30aad6a9a3425ec587e641ef683e0a534d1'
    ) {
      console.log('Invalid password')
      return
    }

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
