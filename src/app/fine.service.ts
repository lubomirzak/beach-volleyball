import { Injectable } from '@angular/core'
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
import * as CryptoJS from 'crypto-js'
import { PlayerService } from './player.service'
import { Player } from 'src/interfaces/player'
import { TrainingService } from './training.service'
import { Training } from 'src/interfaces/training'
import { Fine } from 'src/interfaces/fine'

@Injectable({
  providedIn: 'root',
})
export class FineService {
  constructor(
    private firestore: Firestore,
    private cacheService: CacheService,
    private playerService: PlayerService,
    private trainingService: TrainingService
  ) {}

  get = async (): Promise<FineDetails[]> => {
    let result: FineDetails[] = []
    let playersData: Player[] = []
    let trainingsData: Training[] = []

    let finesFromCache = this.cacheService.get('fines')
    if (finesFromCache.length != 0) {
      console.log('Returning fines from cache')
      return finesFromCache
    }

    playersData = await this.playerService.get()
    trainingsData = await this.trainingService.get()

    const snapshot = await getDocs(collection(this.firestore, 'fines'))
    snapshot.forEach((doc) => {
      let item = doc.data()

      let player = playersData.filter((p) => p.id == item['playerId'])[0]
      let training = trainingsData.filter((p) => p.id == item['trainingId'])[0]

      let fine: FineDetails = {
        id: item['id'],
        playerName: `${player.firstName} ${player.lastName}`,
        amount: item['amount'],
        amountString: `${item['amount']} EUR`,
        created: item['created'],
        trainingId: item['trainingId'],
        playerId: item['playerId'],
        date: training.date,
      }

      result.push(fine)
    })

    return result.sort((a, b) =>
      b.created.toString().localeCompare(a.created.toString())
    )
  }

  create = async (
    playerId: string,
    trainingId: string,
    password: string,
    amount: number
  ): Promise<void | DocumentReference<DocumentData>> => {
    // verify password
    if (
      CryptoJS.SHA1(password).toString() !=
      '738ad30aad6a9a3425ec587e641ef683e0a534d1'
    ) {
      console.log('Invalid password')
      return
    }

    const fine: Fine = {
      id: this.generateGUID(),
      playerId: playerId,
      amount: amount,
      trainingId: trainingId,
      created: Date.now(),
    }

    try {
      const newMessageRef = await addDoc(
        collection(this.firestore, 'fines'),
        fine
      )
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
