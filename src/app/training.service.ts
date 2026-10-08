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
import { Training } from 'src/interfaces/training'
import { MatchService } from './match.service'
import { PlayerService } from './player.service'
import { TrainingDetails } from 'src/interfaces/trainingDetails'
import { TrainingDetailsMatch } from 'src/interfaces/trainingDetailsMatch'
import { TrainingDetailsScoreboard } from 'src/interfaces/trainingDetailsScoreboard'
import { TrainingDetailsScoreboardTeam } from 'src/interfaces/trainingDetailsScoreboardTeam'
import { Team } from 'src/interfaces/team'
import { buildScoreboards, buildTeams, compareLeaderboardRows } from './match-statistics'
import { CacheService } from './cache.service'
import { SHARED_COLLECTIONS, SeasonStorageService } from './season-storage.service'

@Injectable({
  providedIn: 'root',
})
export class TrainingService {
  constructor(
    private firestore: Firestore,
    private matchService: MatchService,
    private playerService: PlayerService,
    private cacheService: CacheService,
    private injector: EnvironmentInjector,
    private seasonStorage: SeasonStorageService
  ) {}

  get = async (seasonId: string = this.seasonStorage.currentSeasonId): Promise<Training[]> => {
    return this.cacheService.getOrLoad(`trainings:${seasonId}`, async () => {
      const result: Training[] = []
      const snapshot = await runInInjectionContext(this.injector, () => {
        const trainingRef = collection(this.firestore, SHARED_COLLECTIONS.trainings)
        return getDocs(query(trainingRef, where('seasonId', '==', seasonId)))
      })
      snapshot.forEach((doc) => {
        const item = doc.data()
        result.push({
          id: item['id'],
          date: new Date(item['date']['seconds'] * 1000),
        })
      })
      return result.sort((a, b) => b.date.getTime() - a.date.getTime())
    })
  }

  getById = async (trainingId: string): Promise<Training> => {
    const trainings = await this.get()
    return trainings.find(training => training.id === trainingId)!
  }

  getTrainingDetails = async (trainingId: string): Promise<TrainingDetails> => {
    const players = await this.playerService.get()
    const matches = await this.matchService.getMatchesForTraining(trainingId)
    const training = await this.getById(trainingId)

    let trainingDetailMatches = matches.map((x) => {
      let player11 = players.filter((y) => y.id == x.team1Player1)[0]
      let player12 = players.filter((y) => y.id == x.team1Player2)[0]
      let player21 = players.filter((y) => y.id == x.team2Player1)[0]
      let player22 = players.filter((y) => y.id == x.team2Player2)[0]

      let trainingDetailMatch: TrainingDetailsMatch = {
        id: x.id,
        firestoreId: x.firestoreId,
        team1: `${player11.firstName} ${player11.lastName}, ${player12.firstName} ${player12.lastName}`,
        team2: `${player21.firstName} ${player21.lastName}, ${player22.firstName} ${player22.lastName}`,
        score: `${x.team1Points}:${x.team2Points}`,
        team1Player1: player11.id,
        team1Player2: player12.id,
        team2Player1: player21.id,
        team2Player2: player22.id,
        team1Points: x.team1Points,
        team2Points: x.team2Points,
        trainingId: x.trainingId,
        created: x.created,
      }

      return trainingDetailMatch
    })

    const [trainingDetailScoreboards] =
      buildScoreboards(trainingDetailMatches, players)

    return {
      date: training.date,
      id: trainingId,
      matches: trainingDetailMatches.sort((a, b) => a.created - b.created),
      scoreboards: trainingDetailScoreboards.sort(
        (a, b) => b.wonSets - a.wonSets
      ),
    }
  }

  getTeams = async (): Promise<Team[]> => {
    const [players, matches] = await Promise.all([
      this.playerService.get(),
      this.matchService.getAllMatches(),
    ])
    return buildTeams(matches, players)
  }

  getLeaderboard = async (seasonId?: string): Promise<
    [TrainingDetailsScoreboard[], TrainingDetailsScoreboardTeam[]]
  > => {
    const [currentPlayers, matches] = await Promise.all([
      this.playerService.get(),
      this.matchService.getAllMatches(seasonId),
    ])
    let [trainingDetailScoreboards, trainingDetailScoreboardsTeams] =
      buildScoreboards(matches, currentPlayers)

    // Temporarily skip the minimum-match requirement for the current season.
    // Keep the existing threshold on completed seasons.
    if ((seasonId ?? this.seasonStorage.currentSeasonId) !== this.seasonStorage.currentSeasonId) {
      trainingDetailScoreboards = trainingDetailScoreboards.filter(
        (x) => x.wonSets + x.lostSets > 6
      )
      trainingDetailScoreboardsTeams = trainingDetailScoreboardsTeams.filter(
        (x) => x.wonSets + x.lostSets > 6
      )
    }

    return [
      trainingDetailScoreboards.sort(compareLeaderboardRows),
      trainingDetailScoreboardsTeams.sort(compareLeaderboardRows),
    ]
  }

  create = async (date: Date): Promise<void | DocumentReference<DocumentData>> => {
    const training: Training = {
      id: this.generateGUID(),
      date,
    }

    try {
      const newMessageRef = await runInInjectionContext(this.injector, () =>
        addDoc(collection(this.firestore, SHARED_COLLECTIONS.trainings),
          { ...training, seasonId: this.seasonStorage.currentSeasonId })
      )
      this.cacheService.clear(`trainings:${this.seasonStorage.currentSeasonId}`)
      return newMessageRef
    } catch (error) {
      console.error('Error writing new training to Firebase Database', error)
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
