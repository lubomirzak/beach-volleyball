import { Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'
import { PlayersComponent } from './players/players.component'
import { PlayerDetailComponent } from './player-detail/player-detail.component'
import { TrainingsComponent } from './trainings/trainings.component'
import { TrainingDetailComponent } from './training-detail/training-detail.component'
import { FinesComponent } from './fines/fines.component'
import { HistoryComponent } from './history/history.component'

const routeConfig: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Beach Volley Stats',
  },
  {
    path: 'players',
    component: PlayersComponent,
    title: 'Players',
  },
  {
    path: 'players/:id',
    component: PlayerDetailComponent,
    title: 'Player details',
  },
  {
    path: 'trainings',
    component: TrainingsComponent,
    title: 'Trainings',
  },
  {
    path: 'trainingdetail/:id',
    component: TrainingDetailComponent,
    title: 'Training details',
  },
  {
    path: 'history',
    component: HistoryComponent,
    title: 'History',
  },
  {
    path: 'history/:season',
    component: HomeComponent,
    title: 'Season leaderboards',
  },
    {
    path: 'fines',
    component: FinesComponent,
    title: 'Fines',
  },
]
export default routeConfig
