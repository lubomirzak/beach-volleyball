import { Injectable } from '@angular/core'
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
import * as CryptoJS from 'crypto-js'

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  constructor(private firestore: Firestore) {}
  getMatchesForTraining = async (trainingId: string): Promise<Match[]> => {
    let result: Match[] = []

    let matchesRef = collection(this.firestore, 'matches')
    let queryRef = query(matchesRef, where('trainingId', '==', trainingId))
    const snapshot = await getDocs(queryRef)
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

  getAllMatches = async (): Promise<Match[]> => {
    let result: Match[] = []

    let matchesRef = collection(this.firestore, 'matches')
    let queryRef = query(matchesRef)

    const snapshot = await getDocs(queryRef)
    snapshot.forEach((doc) => {
      let item = doc.data()

      let match: Match = {
        id: item['id'],
        trainingId: 'UNKNOWN',
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
    team2Points: number,
    password: string
  ): Promise<void | DocumentReference<DocumentData>> => {
    // verify password
    if (
      CryptoJS.SHA1(password).toString() !=
      '738ad30aad6a9a3425ec587e641ef683e0a534d1'
    ) {
      console.log('Invalid password')
      return
    }

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
      const newMessageRef = await addDoc(
        collection(this.firestore, 'matches'),
        match
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
