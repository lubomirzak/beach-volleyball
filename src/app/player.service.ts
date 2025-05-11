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

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  firestore: Firestore = inject(Firestore)

  getData = async (): Promise<Player[]> => {
    let result: Player[] = []

    const querySnapshot = await getDocs(collection(this.firestore, 'players'))
    querySnapshot.forEach((doc) => {
      let item = doc.data()
      let player: Player = {
        id: item['id'],
        attending: item['attending'],
        firstName: item['firstName'],
        lastName: item['lastName'],
      }

      result.push(player)
    })

    return result
  }

  createNewPlayer = async (
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
