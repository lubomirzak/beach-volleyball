import {Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {DetailsComponent} from './details/details.component';
import {PlayersComponent} from './players/players.component';

const routeConfig: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Home page'
  },
  {
    path: 'details/:id',
    component: DetailsComponent,
    title: 'Home details',
  },
   {
    path: 'players',
    component: PlayersComponent,
    title: 'Players',
  },
];
export default routeConfig;