import { Component, ViewChild, inject } from '@angular/core'
import { NavigationEnd, Router, RouterModule } from '@angular/router'
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav'
import { MatListModule, MatNavList } from '@angular/material/list'
import { MatButtonModule } from '@angular/material/button'
import { BreakpointObserver } from '@angular/cdk/layout'
import { MatIconModule } from '@angular/material/icon'
import routeConfig from './routes'
import { filter } from 'rxjs'
import { CommonModule } from '@angular/common'
import { AuthService } from './auth.service'

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
          *ngIf="isMobile"
          (click)="toggleMenu()"
          [attr.aria-label]="menuOpen ? 'Close menu' : 'Open menu'"
          class="nav-button"
        >
          <mat-icon>{{ menuOpen ? 'close' : 'menu' }}</mat-icon>
        </button>
        <a [routerLink]="['/']">
          <div class="logo">
            <img src="assets/beach-logo.svg" class="logo-img" />
          </div>
          <div class="logo-text">Beach volley stats</div>
        </a>
        <div class="auth-controls">
          @if (authService.user$ | async; as account) {
            <span>{{ account.displayName || account.email }}</span>
            <button mat-button type="button" (click)="signOut()">Sign out</button>
          } @else {
            <button mat-button type="button" (click)="signIn()">Sign in with Google</button>
          }
        </div>
      </div>
      @if (authError) {
        <p class="auth-error" role="alert">{{ authError }}</p>
      }

      <section>
        <mat-sidenav-container style="min-height: 1000px">
          <mat-sidenav
            [mode]="isMobile ? 'over' : 'side'"
            [opened]="!isMobile"
            (openedChange)="menuOpen = $event"
          >
            <mat-nav-list class="sidebar">
              <a mat-list-item [routerLink]="['/']">Home</a>
              <a mat-list-item [routerLink]="['/trainings']">Trainings</a>
              <a mat-list-item [routerLink]="['/players']">Players</a>
              <a mat-list-item [routerLink]="['/fines']">Fines</a>
              @if (authService.isAdmin$ | async) {
                <a mat-list-item [routerLink]="['/substitute-payments']">Substitute payments</a>
              }
              <a mat-list-item [routerLink]="['/history']">History</a>
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
  readonly authService = inject(AuthService)
  authError = ''
  isMobile = false
  menuOpen = false

  async signIn() {
    this.authError = ''
    try {
      await this.authService.signIn()
    } catch (error) {
      console.error('Google sign-in failed', error)
      const code = error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : 'unknown-error'
      switch (code) {
        case 'auth/unauthorized-domain':
          this.authError = `Add ${window.location.hostname} in Firebase Authentication → Settings → Authorized domains.`
          break
        case 'auth/operation-not-allowed':
          this.authError = 'Enable Google in Firebase Authentication → Sign-in method.'
          break
        case 'auth/popup-blocked':
          this.authError = 'Allow pop-ups for this site and try again.'
          break
        case 'auth/popup-closed-by-user':
          this.authError = 'The sign-in window closed before sign-in finished.'
          break
        default:
          this.authError = `Google sign-in failed (${code}). Check the browser console.`
      }
    }
  }

  async signOut() {
    await this.authService.signOut()
  }

  @ViewChild(MatSidenav)
  sidenav?: MatSidenav

  constructor(private observer: BreakpointObserver, private router: Router) {
    this.isMobile = this.observer.isMatched('(max-width: 800px)')
    this.observer.observe(['(max-width: 800px)']).subscribe((res) => {
      this.isMobile = res.matches
    })
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile) {
          void this.sidenav?.close()
        }
      })
  }

  toggleMenu() {
    void this.sidenav?.toggle()
  }
}
