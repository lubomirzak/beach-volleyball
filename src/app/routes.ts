import { Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'
import { PlayersComponent } from './players/players.component'
import { TrainingsComponent } from './trainings/trainings.component'
import { TrainingDetailComponent } from './training-detail/training-detail.component'

const routeConfig: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Home page',
  },
  {
    path: 'players',
    component: PlayersComponent,
    title: 'Players',
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
]
export default routeConfig
