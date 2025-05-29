import { Component, ViewChild } from '@angular/core'
import { NavigationEnd, Router, RouterModule } from '@angular/router'
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav'
import { MatListModule, MatNavList } from '@angular/material/list'
import { MatButtonModule } from '@angular/material/button'
import { BreakpointObserver } from '@angular/cdk/layout'
import { MatIconModule } from '@angular/material/icon'
import routeConfig from './routes'
import { filter } from 'rxjs'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    MatSidenav,
    MatIconModule,
    MatSidenavModule,
    MatNavList,
    MatListModule,
    MatButtonModule,
    CommonModule,
  ],
  template: `
    <main class="common-main-styles">
      <div class="top-header">
        <button
          mat-icon-button
          *ngIf="sidenav && sidenav.mode === 'over'"
          (click)="sidenav.toggle()"
          class="nav-button"
        >
          <mat-icon *ngIf="sidenav && !sidenav.opened"> menu </mat-icon>
          <mat-icon *ngIf="sidenav && sidenav.opened"> close </mat-icon>
        </button>
        <a [routerLink]="['/']">
          <div class="logo">
            <img src="assets/beach-logo.svg" class="logo-img" />
          </div>
          <div class="logo-text">Beach volley stats</div>
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

  @ViewChild(MatSidenav)
  sidenav!: MatSidenav

  constructor(private observer: BreakpointObserver, private router: Router) {}
  ngAfterViewInit() {
    this.observer.observe(['(max-width: 800px)']).subscribe((res) => {
      if (res.matches) {
        this.sidenav.mode = 'over'
        this.sidenav.close()
      } else {
        this.sidenav.mode = 'side'
        this.sidenav.open()
      }
    })
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.sidenav.mode === 'over') {
          this.sidenav.close()
        }
      })
  }
}
