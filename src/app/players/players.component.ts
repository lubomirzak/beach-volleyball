import { Component, inject } from '@angular/core'
import { AsyncPipe, NgIf } from '@angular/common'
import { MatTableModule } from '@angular/material/table'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { PlayerService } from '../player.service'
import { MatchService } from '../match.service'
import { AuthService } from '../auth.service'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@Component({
  selector: 'app-players',
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NgIf,
    AsyncPipe,
  ],
  template: `
    <div *ngIf="showSpinner">
      <mat-spinner></mat-spinner>
    </div>

    <div *ngIf="!showSpinner">
      <h1>Players</h1>
      <table mat-table [dataSource]="playersData$">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>

        <ng-container matColumnDef="matchesPlayed">
          <th mat-header-cell *matHeaderCellDef>Matches played</th>
          <td mat-cell *matCellDef="let element">{{ element.matchesPlayed }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columnNames"></tr>
        <tr mat-row *matRowDef="let row; columns: columnNames"></tr>
      </table>

      @if (authService.isAdmin$ | async) {
      <mat-divider style="margin-top: 50px; margin-bottom: 50px;"></mat-divider>

      <h3>Add player</h3>

      <form novalidate [formGroup]="applyForm" (ngSubmit)="submitNewPlayer()">
        <div class="row">
          <div class="col">
            <mat-form-field appearance="outline">
              <input
                matInput
                placeholder="First name"
                formControlName="firstName"
              />
            </mat-form-field>
          </div>
          <div class="col">
            <mat-form-field appearance="outline">
              <input
                matInput
                placeholder="Last name"
                formControlName="lastName"
              />
            </mat-form-field>
          </div>
        </div>
        <button type="submit" mat-flat-button>
          Create
        </button>
      </form>
      }
    </div>
  `,
  styles: `
    .example-container {
    display: flex;
    flex-direction: column;
    padding-top: 50px;
    padding-bottom: 50px;
  }

  .example-container > * {
    width: 100%;
  }`,
})
export class PlayersComponent {
  readonly authService = inject(AuthService)
  playersData$: { id: string; name: string; matchesPlayed: number }[] = []
  columnNames: string[] = ['name', 'matchesPlayed']
  showSpinner: boolean = true
  applyForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
  })

  constructor(
    private snackBar: MatSnackBar,
    private playerService: PlayerService,
    private matchService: MatchService
  ) {
    this.reloadData()
  }

  submitNewPlayer = async () => {
    const firstName = this.applyForm.controls.firstName.value?.trim() ?? ''
    const lastName = this.applyForm.controls.lastName.value?.trim() ?? ''
    if (!firstName || !lastName) {
      this.snackBar.open('Enter first and last name.', 'Close', { duration: 3000 })
      return
    }

    let res = await this.playerService.create(firstName, lastName)

    if (res) {
      this.applyForm.reset()
      this.reloadData()
      this.snackBar.open('Player was created', 'Close', {
        duration: 3000,
      })
    } else {
      this.snackBar.open('Could not create player. Check your sign-in and Firestore rules.', 'Close', { duration: 5000 })
    }
  }

  reloadData = async () => {
    const [players, matches] = await Promise.all([
      this.playerService.get(),
      this.matchService.getAllMatches(),
    ])
    const matchesPlayedById = new Map<string, number>()
    for (const match of matches) {
      const playerIds = new Set([
        match.team1Player1,
        match.team1Player2,
        match.team2Player1,
        match.team2Player2,
      ])
      for (const id of playerIds) {
        matchesPlayedById.set(id, (matchesPlayedById.get(id) ?? 0) + 1)
      }
    }

    this.playersData$ = players.sort((a, b) => {
      const aPlayed = (matchesPlayedById.get(a.id) ?? 0) > 0
      const bPlayed = (matchesPlayedById.get(b.id) ?? 0) > 0
      return Number(bPlayed) - Number(aPlayed)
        || a.lastName.localeCompare(b.lastName)
        || a.firstName.localeCompare(b.firstName)
    }).map(player => ({
      id: player.id,
      name: `${player.lastName.toLocaleUpperCase()} ${player.firstName}`,
      matchesPlayed: matchesPlayedById.get(player.id) ?? 0,
    }))
    this.showSpinner = false
  }
}
