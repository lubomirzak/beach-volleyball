import { Component, inject } from '@angular/core'
import { AsyncPipe, NgIf } from '@angular/common'
import { MatTableModule } from '@angular/material/table'
import { MatSortModule, Sort } from '@angular/material/sort'
import { sortTableRows } from '../table-sort'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { TrainingService } from '../training.service'
import { MatchService } from '../match.service'
import { PlayerService } from '../player.service'
import { AuthService } from '../auth.service'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { LoadingSpinnerComponent } from '../loading-spinner.component'
import { provideNativeDateAdapter } from '@angular/material/core'
import { RouterModule } from '@angular/router'
import { Match } from 'src/interfaces/match'

@Component({
  selector: 'app-trainings',
  imports: [MatSortModule, 
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    LoadingSpinnerComponent,
    MatDatepickerModule,
    NgIf,
    AsyncPipe,
    RouterModule,
  ],
  template: `
    <h1>Trainings</h1>
    <div *ngIf="showSpinner">
      <app-loading-spinner label="Loading trainings" />
    </div>

    <div *ngIf="!showSpinner">
      <table mat-table matSort [matSortDisableClear]="true" (matSortChange)="sortTrainings($event)" [dataSource]="trainingsData$">
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
          <td mat-cell *matCellDef="let element">
            <a
              [routerLink]="['/trainingdetail', element.id]"
              style="color: var(--mat-sys-primary)"
              >{{ element.date.toDateString() }}</a
            >
          </td>
        </ng-container>

        <ng-container matColumnDef="players">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Players</th>
          <td mat-cell *matCellDef="let element">{{ element.players }}</td>
        </ng-container>

        <ng-container matColumnDef="matchesPlayed">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Matches played</th>
          <td mat-cell *matCellDef="let element">{{ element.matchesPlayed }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columnNames"></tr>
        <tr mat-row *matRowDef="let row; columns: columnNames"></tr>
      </table>

      @if (authService.isAdmin$ | async) {
      <mat-divider style="margin-top: 50px; margin-bottom: 50px;"></mat-divider>

      <h3>Add training</h3>
      <form novalidate [formGroup]="applyForm" (ngSubmit)="create()">
        <div class="row">
          <mat-form-field>
            <mat-label>Choose a date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date" />
            <mat-datepicker-toggle
              matIconSuffix
              [for]="picker"
            ></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>
        <button type="submit" mat-flat-button>Create</button>
      </form>
      }
    </div>
  `,
  providers: [provideNativeDateAdapter()],
})
export class TrainingsComponent {
  readonly authService = inject(AuthService)
  trainingsData$: { id: string; date: Date; players: string; matchesPlayed: number }[] = []
  private trainingSort: Sort = { active: '', direction: '' }

  sortTrainings(sort: Sort): void {
    this.trainingSort = sort
    this.trainingsData$ = sortTableRows(this.trainingsData$, sort)
  }

  columnNames: string[] = ['date', 'players', 'matchesPlayed']
  showSpinner: boolean = true
  applyForm = new FormGroup({
    date: new FormControl<Date | null>(null),
  })

  constructor(
    private trainingService: TrainingService,
    private matchService: MatchService,
    private playerService: PlayerService,
    private snackBar: MatSnackBar
  ) {
    this.reloadData()
  }

  create = async () => {
    const date = this.applyForm.controls.date.value
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      this.snackBar.open('Choose a valid date.', 'Close', { duration: 3000 })
      return
    }

    let res = await this.trainingService.create(date)

    if (res) {
      this.applyForm.reset()
      this.reloadData()
      this.snackBar.open('Training was created', 'Close', {
        duration: 3000,
      })
    } else {
      this.snackBar.open('Could not create training. Check your sign-in and Firestore rules.', 'Close', { duration: 5000 })
    }
  }

  reloadData = async () => {
    const [trainings, matches, players] = await Promise.all([
      this.trainingService.get(),
      this.matchService.getAllMatches(),
      this.playerService.get(),
    ])
    const matchesByTraining = new Map<string, Match[]>()
    for (const match of matches) {
      const trainingMatches = matchesByTraining.get(match.trainingId) ?? []
      trainingMatches.push(match)
      matchesByTraining.set(match.trainingId, trainingMatches)
    }
    const lastNameById = new Map(players.map(player => [player.id, player.lastName] as const))

    this.trainingsData$ = sortTableRows(trainings.map(training => {
      const trainingMatches = matchesByTraining.get(training.id) ?? []
      const playerIds = new Set(trainingMatches.flatMap(match => [
        match.team1Player1,
        match.team1Player2,
        match.team2Player1,
        match.team2Player2,
      ]))
      const lastNames = Array.from(playerIds, id => lastNameById.get(id) ?? 'Unknown player')
        .sort((a, b) => a.localeCompare(b))

      return {
        id: training.id,
        date: training.date,
        players: lastNames.join(', ') || '—',
        matchesPlayed: trainingMatches.length,
      }
    }), this.trainingSort)
    this.showSpinner = false
  }
}
