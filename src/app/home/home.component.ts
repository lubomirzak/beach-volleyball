import { Component, effect, signal, Signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatTableModule } from '@angular/material/table'
import { MatSortModule, Sort } from '@angular/material/sort'
import { scoreboardSortValue, sortTableRows } from '../table-sort'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { TrainingService } from '../training.service'
import { HISTORY_SEASONS } from '../history/seasons'
import { MatchService } from '../match.service'
import { SeasonStorageService } from '../season-storage.service'
import { SeasonSummary, summarizeSeason } from '../season-summary'
import { SeasonFineTotalService } from '../season-fine-total.service'
import { AuthService } from '../auth.service'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-home',
  imports: [MatSortModule, CommonModule, MatTableModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule, RouterModule],
  template: `
    <header class="page-heading">
      <h1>{{ title }}</h1>
      @if (isHistory) {
        <a mat-stroked-button class="back-to-seasons" [routerLink]="['/history']">
          <mat-icon>arrow_back</mat-icon>
          All seasons
        </a>
      }
    </header>
    @if (loading) {
      <mat-spinner></mat-spinner>
    }
    @if (error) {
      <p role="alert">{{ error }}</p>
    }

    @if (!loading && !error) {
    @if (summary) {
      <section class="season-summary" aria-label="Season totals">
        <div class="summary-card"><span>Matches played</span><strong>{{ summary.matches }}</strong></div>
        <div class="summary-card"><span>Players</span><strong>{{ summary.players }}</strong></div>
        <div class="summary-card"><span>Trainings</span><strong>{{ summary.trainings }}</strong></div>
        <div class="summary-card"><span>Total fines</span>
          <strong>{{ fineTotalCents === null ? '—' : (fineTotalCents / 100 | currency:'EUR':'symbol':'1.2-2') }}</strong>
        </div>
      </section>
    }
    <div>
      <div class="table table-left">
        <table mat-table matSort [matSortActive]="playerSort.active" [matSortDirection]="playerSort.direction"
          [matSortDisableClear]="true" (matSortChange)="sortPlayers($event)" [dataSource]="scoreboards$">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Player</th>
            <td mat-cell *matCellDef="let element">{{ element.name }}</td>
          </ng-container>

          <ng-container matColumnDef="sets">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Sets</th>
            <td mat-cell *matCellDef="let element">{{ element.sets }}</td>
          </ng-container>

          <ng-container matColumnDef="points">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Points</th>
            <td mat-cell *matCellDef="let element">{{ element.points }}</td>
          </ng-container>

          <ng-container matColumnDef="ratio">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Ratio</th>
            <td mat-cell *matCellDef="let element">{{ element.ratio }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="scoreboardColumnNames"></tr>
          <tr mat-row *matRowDef="let row; columns: scoreboardColumnNames"></tr>
        </table>
      </div>

      <div class="table table-right">
        <table mat-table matSort [matSortActive]="teamSort.active" [matSortDirection]="teamSort.direction"
          [matSortDisableClear]="true" (matSortChange)="sortTeams($event)" [dataSource]="scoreboardsTeams$">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Team</th>
            <td mat-cell *matCellDef="let element">{{ element.name }}</td>
          </ng-container>

          <ng-container matColumnDef="sets">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Sets</th>
            <td mat-cell *matCellDef="let element">{{ element.sets }}</td>
          </ng-container>

          <ng-container matColumnDef="points">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Points</th>
            <td mat-cell *matCellDef="let element">{{ element.points }}</td>
          </ng-container>

          <ng-container matColumnDef="ratio">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Ratio</th>
            <td mat-cell *matCellDef="let element">{{ element.ratio }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="scoreboardColumnNames"></tr>
          <tr mat-row *matRowDef="let row; columns: scoreboardColumnNames"></tr>
        </table>
      </div>
    </div>
    }
  `,
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  scoreboards$: any[] = []
  scoreboardsTeams$: any[] = []
  scoreboardColumnNames: any[] = ['name', 'sets', 'points', 'ratio']
  title = 'Leaderboards'
  isHistory = false
  loading = true
  error = ''
  summary: SeasonSummary | null = null
  fineTotalCents: number | null = null
  private requestId = 0
  private fineRequestId = 0
  private readonly selectedSeasonId = signal<string | null>(null)
  private readonly isAdmin: Signal<boolean>
  playerSort: Sort = { active: '', direction: '' }
  teamSort: Sort = { active: '', direction: '' }

  sortPlayers(sort: Sort): void {
    this.playerSort = sort
    this.scoreboards$ = sortTableRows(this.scoreboards$, sort, scoreboardSortValue)
  }

  sortTeams(sort: Sort): void {
    this.teamSort = sort
    this.scoreboardsTeams$ = sortTableRows(this.scoreboardsTeams$, sort, scoreboardSortValue)
  }

  constructor(
    private trainingService: TrainingService,
    private matchService: MatchService,
    private seasonStorage: SeasonStorageService,
    private fineTotals: SeasonFineTotalService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.isAdmin = toSignal(this.authService.isAdmin$, { initialValue: false })
    effect(() => {
      const seasonId = this.selectedSeasonId()
      const admin = this.isAdmin()
      if (seasonId) void this.loadFineTotal(seasonId, admin)
    })
    this.route.paramMap.subscribe(params => {
      const slug = params.get('season')
      if (!slug) {
        this.isHistory = false
        this.title = 'Leaderboards'
        this.selectedSeasonId.set(this.seasonStorage.currentSeasonId)
        void this.reloadData()
        return
      }

      this.isHistory = true
      const season = HISTORY_SEASONS.find(item => item.slug === slug)
      if (!season) {
        this.requestId++
        this.fineRequestId++
        this.selectedSeasonId.set(null)
        this.title = 'Season not found'
        this.error = 'This season is not available.'
        this.loading = false
        this.scoreboards$ = []
        this.scoreboardsTeams$ = []
        this.summary = null
        this.fineTotalCents = null
        return
      }

      this.title = `${season.label} leaderboards`
      this.selectedSeasonId.set(season.slug)
      void this.reloadData(season.slug)
    })
  }

  reloadData = async (seasonId?: string) => {
    const requestId = ++this.requestId
    const selectedSeasonId = seasonId ?? this.seasonStorage.currentSeasonId
    this.loading = true
    this.error = ''
    this.summary = null
    try {
      const [[scoreboards, scoreboardsTeams], matches, trainings] = await Promise.all([
        this.trainingService.getLeaderboard(selectedSeasonId),
        this.matchService.getAllMatches(selectedSeasonId),
        this.trainingService.get(selectedSeasonId),
      ])
      if (requestId !== this.requestId) return
      this.scoreboards$ = sortTableRows(scoreboards, this.playerSort, scoreboardSortValue)
      this.scoreboardsTeams$ = sortTableRows(scoreboardsTeams, this.teamSort, scoreboardSortValue)
      this.summary = summarizeSeason(matches, trainings)
    } catch (error) {
      if (requestId !== this.requestId) return
      console.error('Could not load leaderboards', error)
      this.error = 'Could not load leaderboards.'
    } finally {
      if (requestId === this.requestId) this.loading = false
    }
  }

  private async loadFineTotal(seasonId: string, admin: boolean): Promise<void> {
    const requestId = ++this.fineRequestId
    this.fineTotalCents = null
    try {
      const total = admin ? await this.fineTotals.refresh(seasonId) : await this.fineTotals.get(seasonId)
      if (requestId === this.fineRequestId) this.fineTotalCents = total
    } catch (error) {
      console.error('Could not load season fine total', error)
      if (!admin || requestId !== this.fineRequestId) return
      try {
        const total = await this.fineTotals.get(seasonId)
        if (requestId === this.fineRequestId) this.fineTotalCents = total
      } catch (readError) {
        console.error('Could not read public season fine total', readError)
      }
    }
  }
}
