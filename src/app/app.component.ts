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
    <main style="background-color: var(--mat-sys-inverse-primary);">
      <div class="top-header">
        <a [routerLink]="['/']">
          <button mat-raised-button>Beach volley</button>
        </a>
      </div>

      <section>
        <mat-sidenav-container>
          <mat-sidenav mode="side" opened>
            <mat-nav-list class="sidebar">
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
