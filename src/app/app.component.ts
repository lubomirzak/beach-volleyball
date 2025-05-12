import { Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatListModule, MatNavList } from '@angular/material/list'
import {MatButtonModule} from '@angular/material/button';
import routeConfig from './routes'

@Component({
  selector: 'app-root',
  imports: [RouterModule, MatSidenavModule, MatNavList, MatListModule, MatButtonModule],
  template: `
    <main class="common-main-styles">
      <div class="top-header">
        <a [routerLink]="['/']">
          <div class="logo">
             <img src="assets/beach-logo.svg" style="height: 75px; width: 75px;"/>
          </div>
          <div class="logo-text">
             Beach volley stats
          </div>
        </a>
      </div>

      <section>
        <mat-sidenav-container style="min-height: 1000px">
          <mat-sidenav mode="side" opened>
            <mat-nav-list class="sidebar">
              <a mat-list-item [routerLink]="['/trainings']">Trainings</a>
              <a mat-list-item [routerLink]="['/players']">Players</a>
            </mat-nav-list>
          </mat-sidenav>
          <mat-sidenav-content>
            <div class="main-content">
              <router-outlet></router-outlet>
            </div>
          </mat-sidenav-content>
        </mat-sidenav-container>
      </section>
    </main>
  `,
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'homes'
  routes: any = routeConfig
}
