import { Component } from '@angular/core'
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
  private requestId = 0
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

  constructor(private trainingService: TrainingService, private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('season')
      if (!slug) {
        this.isHistory = false
        this.title = 'Leaderboards'
        void this.reloadData()
        return
      }

      this.isHistory = true
      const season = HISTORY_SEASONS.find(item => item.slug === slug)
      if (!season) {
        this.requestId++
        this.title = 'Season not found'
        this.error = 'This season is not available.'
        this.loading = false
        this.scoreboards$ = []
        this.scoreboardsTeams$ = []
        return
      }

      this.title = `${season.label} leaderboards`
      void this.reloadData(season.slug)
    })
  }

  reloadData = async (seasonId?: string) => {
    const requestId = ++this.requestId
    this.loading = true
    this.error = ''
    try {
      const [scoreboards, scoreboardsTeams] = await this.trainingService.getLeaderboard(seasonId)
      if (requestId !== this.requestId) return
      this.scoreboards$ = sortTableRows(scoreboards, this.playerSort, scoreboardSortValue)
      this.scoreboardsTeams$ = sortTableRows(scoreboardsTeams, this.teamSort, scoreboardSortValue)
    } catch (error) {
      if (requestId !== this.requestId) return
      console.error('Could not load leaderboards', error)
      this.error = 'Could not load leaderboards.'
    } finally {
      if (requestId === this.requestId) this.loading = false
    }
  }
}
