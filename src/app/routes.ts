import { Routes } from '@angular/router'
import { HomeComponent } from './home/home.component'
import { PlayersComponent } from './players/players.component'
import { TrainingsComponent } from './trainings/trainings.component'
import { TrainingDetailComponent } from './training-detail/training-detail.component'
import { FinesComponent } from './fines/fines.component'

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
    path: 'fines',
    component: FinesComponent,
    title: 'Fines',
  },
]
export default routeConfig
