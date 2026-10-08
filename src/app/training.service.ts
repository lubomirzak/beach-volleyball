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
import { Player } from 'src/interfaces/player'
import { Team } from 'src/interfaces/team'
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

    var [trainingDetailScoreboards, trainingDetailScoreboardsTeams] =
      this.processTrainingDetailMatches(trainingDetailMatches, players)

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
    const players = await this.playerService.get()
    let matches = await this.matchService.getAllMatches()

    let result: Team[] = [];

    matches.map((x) => {
      let player11 = players.filter((y) => y.id == x.team1Player1)[0]
      let player12 = players.filter((y) => y.id == x.team1Player2)[0]
      let player21 = players.filter((y) => y.id == x.team2Player1)[0]
      let player22 = players.filter((y) => y.id == x.team2Player2)[0]

      // check if team exists
      let team1exists = result.filter(x => x.player1Id == player11.id && x.player2Id == player12.id);
      if (team1exists.length > 0){
        team1exists[0].setsPlayed = team1exists[0].setsPlayed + 1;
      }
      else {
        result.push({
          id: `${player11.id}###${player12.id}`,
          setsPlayed: 1,
          player1Id: player11.id,
          player1Name: `${player11.firstName} ${player11.lastName}`,
          player2Id: player12.id,
          player2Name: `${player12.firstName} ${player12.lastName}`
        })
      }

      // check if second team exists
      let team2exists = result.filter(x => x.player1Id == player21.id && x.player2Id == player22.id);
      if (team2exists.length > 0){
        team2exists[0].setsPlayed = team2exists[0].setsPlayed + 1;
      } else {
        result.push({
          id: `${player21.id}###${player22.id}`,
          setsPlayed: 1,
          player1Id: player21.id,
          player1Name: `${player21.firstName} ${player21.lastName}`,
          player2Id: player22.id,
          player2Name: `${player22.firstName} ${player22.lastName}`
        })
      }
    })

    return result.sort((a,b) => b.setsPlayed - a.setsPlayed)
  }

  getLeaderboard = async (seasonId?: string): Promise<
    [TrainingDetailsScoreboard[], TrainingDetailsScoreboardTeam[]]
  > => {
    const [currentPlayers, matches] = await Promise.all([
      this.playerService.get(),
      this.matchService.getAllMatches(seasonId),
    ])
    const playersById = new Map(currentPlayers.map(player => [player.id, player] as const))
    for (const match of matches) {
      for (const id of [match.team1Player1, match.team1Player2, match.team2Player1, match.team2Player2]) {
        if (!playersById.has(id)) {
          playersById.set(id, { id, firstName: 'Unknown player', lastName: `(${id})` })
        }
      }
    }
    const players = Array.from(playersById.values())

    let trainingDetailMatches = matches.map((x) => {
      let player11 = players.filter((y) => y.id == x.team1Player1)[0]
      let player12 = players.filter((y) => y.id == x.team1Player2)[0]
      let player21 = players.filter((y) => y.id == x.team2Player1)[0]
      let player22 = players.filter((y) => y.id == x.team2Player2)[0]

      let trainingDetailMatch: TrainingDetailsMatch = {
        id: x.id,
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

    var [trainingDetailScoreboards, trainingDetailScoreboardsTeams] =
      this.processTrainingDetailMatches(trainingDetailMatches, players)

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
      trainingDetailScoreboards.sort(
        (a, b) => parseFloat(b.ratio) - parseFloat(a.ratio)
      ),
      trainingDetailScoreboardsTeams.sort(
        (a, b) => parseFloat(b.ratio) - parseFloat(a.ratio)
      ),
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

  processTrainingDetailMatches = (
    trainingDetailMatches: TrainingDetailsMatch[],
    players: Player[]
  ): [TrainingDetailsScoreboard[], TrainingDetailsScoreboardTeam[]] => {
    let trainingDetailScoreboards: TrainingDetailsScoreboard[] = []
    let trainingDetailScoreboardsTeams: TrainingDetailsScoreboardTeam[] = []

    trainingDetailMatches.forEach((item) => {
      let team1won = item.team1Points > item.team2Points

      // Process individuals
      let player11 = players.filter((x) => x.id == item.team1Player1)[0]

      trainingDetailScoreboards = this.processMatch(
        trainingDetailScoreboards,
        player11.id,
        `${player11.firstName} ${player11.lastName}`,
        team1won ? item.team1Points : item.team2Points,
        team1won ? item.team2Points : item.team1Points,
        team1won ? 1 : 0,
        team1won ? 0 : 1
      )

      let player12 = players.filter((x) => x.id == item.team1Player2)[0]

      trainingDetailScoreboards = this.processMatch(
        trainingDetailScoreboards,
        player12.id,
        `${player12.firstName} ${player12.lastName}`,
        team1won ? item.team1Points : item.team2Points,
        team1won ? item.team2Points : item.team1Points,
        team1won ? 1 : 0,
        team1won ? 0 : 1
      )

      let team2won = !team1won
      let player21 = players.filter((x) => x.id == item.team2Player1)[0]

      trainingDetailScoreboards = this.processMatch(
        trainingDetailScoreboards,
        player21.id,
        `${player21.firstName} ${player21.lastName}`,
        team2won ? item.team1Points : item.team2Points,
        team2won ? item.team2Points : item.team1Points,
        team2won ? 1 : 0,
        team2won ? 0 : 1
      )

      let player22 = players.filter((x) => x.id == item.team2Player2)[0]

      trainingDetailScoreboards = this.processMatch(
        trainingDetailScoreboards,
        player22.id,
        `${player22.firstName} ${player22.lastName}`,
        team2won ? item.team1Points : item.team2Points,
        team2won ? item.team2Points : item.team1Points,
        team2won ? 1 : 0,
        team2won ? 0 : 1
      )

      // Process teams

      trainingDetailScoreboardsTeams = this.processMatchTeam(
        trainingDetailScoreboardsTeams,
        player11.id,
        player12.id,
        `${player11.firstName} ${player11.lastName}`,
        `${player12.firstName} ${player12.lastName}`,
        team1won ? item.team1Points : item.team2Points,
        team1won ? item.team2Points : item.team1Points,
        team1won ? 1 : 0,
        team1won ? 0 : 1
      )

      trainingDetailScoreboardsTeams = this.processMatchTeam(
        trainingDetailScoreboardsTeams,
        player21.id,
        player22.id,
        `${player21.firstName} ${player21.lastName}`,
        `${player22.firstName} ${player22.lastName}`,
        team2won ? item.team1Points : item.team2Points,
        team2won ? item.team2Points : item.team1Points,
        team2won ? 1 : 0,
        team2won ? 0 : 1
      )
    })

    return [trainingDetailScoreboards, trainingDetailScoreboardsTeams]
  }

  processMatch = (
    array: TrainingDetailsScoreboard[],
    playerId: string,
    name: string,
    wonPoints: number,
    lostPoints: number,
    wonSets: number,
    lostSets: number
  ): TrainingDetailsScoreboard[] => {
    let exists = array.filter((x) => x.playerId == playerId)
    let scoreboardToUpdate: TrainingDetailsScoreboard
    if (exists.length > 0) {
      scoreboardToUpdate = exists[0]
      scoreboardToUpdate.lostPoints += lostPoints
      scoreboardToUpdate.lostSets += lostSets
      scoreboardToUpdate.wonPoints += wonPoints
      scoreboardToUpdate.wonSets += wonSets
      scoreboardToUpdate.points = `${scoreboardToUpdate.wonPoints}:${scoreboardToUpdate.lostPoints}`
      scoreboardToUpdate.sets = `${scoreboardToUpdate.wonSets}:${scoreboardToUpdate.lostSets}`

      scoreboardToUpdate.ratio = this.calculateRatio(
        scoreboardToUpdate.wonSets,
        scoreboardToUpdate.lostSets
      )
    } else {
      scoreboardToUpdate = {
        playerId: playerId,
        lostPoints: lostPoints,
        lostSets: lostSets,
        name: name,
        points: `${wonPoints}:${lostPoints}`,
        sets: `${wonSets}:${lostSets}`,
        wonPoints: wonPoints,
        wonSets: wonSets,
        ratio: this.calculateRatio(wonSets, lostSets),
      }
    }

    let result = array.filter((x) => x.playerId != playerId)
    result.push(scoreboardToUpdate)

    return result
  }

  processMatchTeam = (
    array: TrainingDetailsScoreboardTeam[],
    player1Id: string,
    player2Id: string,
    name1: string,
    name2: string,
    wonPoints: number,
    lostPoints: number,
    wonSets: number,
    lostSets: number
  ): TrainingDetailsScoreboardTeam[] => {
    let exists = array.filter(
      (x) => x.player1Id == player1Id && x.player2Id == player2Id
    )

    let scoreboardToUpdate: TrainingDetailsScoreboardTeam
    if (exists.length > 0) {
      scoreboardToUpdate = exists[0]
      scoreboardToUpdate.lostPoints += lostPoints
      scoreboardToUpdate.lostSets += lostSets
      scoreboardToUpdate.wonPoints += wonPoints
      scoreboardToUpdate.wonSets += wonSets
      scoreboardToUpdate.points = `${scoreboardToUpdate.wonPoints}:${scoreboardToUpdate.lostPoints}`
      scoreboardToUpdate.sets = `${scoreboardToUpdate.wonSets}:${scoreboardToUpdate.lostSets}`

      scoreboardToUpdate.ratio = this.calculateRatio(
        scoreboardToUpdate.wonSets,
        scoreboardToUpdate.lostSets
      )
    } else {
      scoreboardToUpdate = {
        player1Id: player1Id,
        player2Id: player2Id,
        lostPoints: lostPoints,
        lostSets: lostSets,
        name: `${name1}, ${name2}`,
        points: `${wonPoints}:${lostPoints}`,
        sets: `${wonSets}:${lostSets}`,
        wonPoints: wonPoints,
        wonSets: wonSets,
        ratio: this.calculateRatio(wonSets, lostSets),
      }
    }

    let result = array.filter(
      (x) => x.player1Id != player1Id || x.player2Id != player2Id
    )
    result.push(scoreboardToUpdate)

    return result
  }

  calculateRatio(wonSets: number, lostSets: number): string {
    let ratio = 0
    if (wonSets == 0) {
      ratio = 0
    } else if (lostSets == 0) {
      ratio = 1
    } else {
      ratio = wonSets / (wonSets + lostSets)
    }

    return ratio.toFixed(2)
  }

  // Naive implementation, but it's enough
  generateGUID(): string {
    const timestamp = new Date().getTime()
    const randomNum = Math.floor(Math.random() * 1000000)
    return `${timestamp}-${randomNum}`
  }
}
