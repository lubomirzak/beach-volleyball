import { Component, inject } from '@angular/core'
import { AsyncPipe, NgIf } from '@angular/common'
import { MatTableModule } from '@angular/material/table'
import { MatSortModule, Sort } from '@angular/material/sort'
import { sortTableRows } from '../table-sort'
import { MatInputModule } from '@angular/material/input'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { PlayerService } from '../player.service'
import { MatchService } from '../match.service'
import { isDecidedMatch } from '../match-statistics'
import { nameMatchesQuery, normalizeName } from '../name-search'
import { HISTORY_SEASONS } from '../history/seasons'
import { AuthService } from '../auth.service'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { RouterModule } from '@angular/router'

interface PlayerRow {
  id: string
  name: string
  matchesThisSeason: number
  totalMatches: number
}

@Component({
  selector: 'app-players',
  imports: [MatSortModule, 
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    RouterModule,
    NgIf,
    AsyncPipe,
  ],
  template: `
    <div *ngIf="showSpinner">
      <mat-spinner></mat-spinner>
    </div>

    <div *ngIf="!showSpinner">
      <h1>Players</h1>
      <mat-form-field appearance="outline" class="player-search">
        <mat-label>Find player</mat-label>
        <input matInput [formControl]="nameFilter" [matAutocomplete]="playerAutocomplete" />
        @if (nameFilter.value) {
          <button mat-icon-button matSuffix type="button" aria-label="Clear player search"
            (click)="nameFilter.setValue('')">
            <mat-icon>close</mat-icon>
          </button>
        }
        <mat-autocomplete #playerAutocomplete="matAutocomplete">
          @for (player of suggestedPlayers; track player.id) {
            <mat-option [value]="player.name">{{ player.name }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
      <table mat-table matSort [matSortDisableClear]="true" (matSortChange)="sortPlayers($event)" [dataSource]="playersData$">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
          <td mat-cell *matCellDef="let element" class="name-cell">
            <a class="player-link" [routerLink]="['/players', element.id]">{{ element.name }}</a>
          </td>
        </ng-container>

        <ng-container matColumnDef="matchesThisSeason">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Matches this season</th>
          <td mat-cell *matCellDef="let element">{{ element.matchesThisSeason }}</td>
        </ng-container>

        <ng-container matColumnDef="totalMatches">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Total matches</th>
          <td mat-cell *matCellDef="let element">{{ element.totalMatches }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columnNames"></tr>
        <tr mat-row *matRowDef="let row; columns: columnNames"></tr>
      </table>
      @if (playersData$.length === 0) {
        <p>No players found.</p>
      }

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
  }

  .name-cell {
    padding: 0;
  }

  .player-search {
    width: min(100%, 360px);
    margin-bottom: 12px;
  }

  .player-link {
    display: block;
    padding: 16px;
    color: var(--mat-sys-primary);
    text-decoration: none;
  }

  .player-link:hover {
    text-decoration: underline;
  }`,
})
export class PlayersComponent {
  readonly authService = inject(AuthService)
  readonly nameFilter = new FormControl('', { nonNullable: true })
  private allPlayersData: PlayerRow[] = []
  private playerSort: Sort = { active: '', direction: '' }

  sortPlayers(sort: Sort): void {
    this.playerSort = sort
    this.applyNameFilter()
  }
  playersData$: PlayerRow[] = []
  suggestedPlayers: PlayerRow[] = []
  columnNames: string[] = ['name', 'matchesThisSeason', 'totalMatches']
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
    this.nameFilter.valueChanges.subscribe(() => this.applyNameFilter())
    this.reloadData()
  }

  private applyNameFilter(): void {
    const query = this.nameFilter.value
    const hasQuery = normalizeName(query).trim().length > 0
    const filtered = hasQuery
      ? this.allPlayersData.filter(player => nameMatchesQuery(player.name, query))
      : this.allPlayersData
    this.playersData$ = sortTableRows(filtered, this.playerSort)
    this.suggestedPlayers = hasQuery ? filtered.slice(0, 8) : []
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
    const [players, matchesBySeason] = await Promise.all([
      this.playerService.get(),
      Promise.all(HISTORY_SEASONS.map(season => this.matchService.getAllMatches(season.slug))),
    ])
    const matchesThisSeasonById = new Map<string, number>()
    const totalMatchesById = new Map<string, number>()
    matchesBySeason.forEach((matches, seasonIndex) => {
      for (const match of matches) {
        if (!isDecidedMatch(match)) continue
        const playerIds = new Set([
          match.team1Player1,
          match.team1Player2,
          match.team2Player1,
          match.team2Player2,
        ])
        for (const id of playerIds) {
          totalMatchesById.set(id, (totalMatchesById.get(id) ?? 0) + 1)
          if (HISTORY_SEASONS[seasonIndex].current) {
            matchesThisSeasonById.set(id, (matchesThisSeasonById.get(id) ?? 0) + 1)
          }
        }
      }
    })

    this.allPlayersData = players.slice().sort((a, b) => {
      return a.lastName.localeCompare(b.lastName)
        || a.firstName.localeCompare(b.firstName)
    }).map(player => ({
      id: player.id,
      name: `${player.lastName.toLocaleUpperCase()} ${player.firstName}`,
      matchesThisSeason: matchesThisSeasonById.get(player.id) ?? 0,
      totalMatches: totalMatchesById.get(player.id) ?? 0,
    }))
    this.applyNameFilter()
    this.showSpinner = false
  }
}
