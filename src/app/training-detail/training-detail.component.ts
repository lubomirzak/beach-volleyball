import { Component, TemplateRef, ViewChild, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { NgIf } from '@angular/common'
import { MatTableModule } from '@angular/material/table'
import { MatSortModule, Sort } from '@angular/material/sort'
import { scoreboardSortValue, sortTableRows } from '../table-sort'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { TrainingService } from '../training.service'
import { MatchService } from '../match.service'
import { AuthService } from '../auth.service'
import { PlayerService } from '../player.service'
import { nameMatchesQuery } from '../name-search'
import { FormControl, ReactiveFormsModule, FormBuilder } from '@angular/forms'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatDividerModule } from '@angular/material/divider'
import { LoadingSpinnerComponent } from '../loading-spinner.component'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { provideNativeDateAdapter } from '@angular/material/core'
import { RouterModule } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { Training } from 'src/interfaces/training'
import { Team } from 'src/interfaces/team'
import { Match } from 'src/interfaces/match'
import { Player } from 'src/interfaces/player'
import { TrainingDetailsMatch } from 'src/interfaces/trainingDetailsMatch'
import { firstValueFrom } from 'rxjs'

@Component({
  selector: 'app-training-detail',
  imports: [MatSortModule, 
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    LoadingSpinnerComponent,
    MatDialogModule,
    MatDatepickerModule,
    NgIf,
    RouterModule,
    CommonModule,
  ],
  template: `
    <div *ngIf="showSpinner">
      <app-loading-spinner label="Loading training details" />
    </div>

    <div *ngIf="!showSpinner">
      <header class="page-heading">
        <h1>
          Training from
          {{ this.trainingData$ ? this.trainingData$.date.toDateString() : '' }}
        </h1>
        <a mat-stroked-button class="back-to-trainings" [routerLink]="['/trainings']">
          <mat-icon>arrow_back</mat-icon>
          All trainings
        </a>
      </header>

      <h3 style="padding-top: 30px">Results</h3>

      <div style="width: 30%; ">
        <table mat-table matSort [matSortDisableClear]="true" (matSortChange)="sortScoreboard($event)" [dataSource]="scoreboards$">
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

      <h3>Matches</h3>
      <div class="matches-table-scroll">
      <table mat-table matSort [matSortDisableClear]="true" (matSortChange)="sortMatches($event)" [dataSource]="matches$">
        <ng-container matColumnDef="team1">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Team 1</th>
          <td
            mat-cell
            *matCellDef="let element"
            (click)="setTeam(element.team1Player1, element.team1Player2)"
            (dblclick)="clearTeams()"
          >
            {{ element.team1 }}
          </td>
        </ng-container>

        <ng-container matColumnDef="team2">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Team 2</th>
          <td
            mat-cell
            *matCellDef="let element"
            (click)="setTeam(element.team2Player1, element.team2Player2)"
            (dblclick)="clearTeams()"
          >
            {{ element.team2 }}
          </td>
        </ng-container>

        <ng-container matColumnDef="score">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Score</th>
          <td mat-cell *matCellDef="let element">{{ element.score }}</td>
        </ng-container>

        <ng-container matColumnDef="actions" stickyEnd>
          <th mat-header-cell *matHeaderCellDef aria-label="Match actions"></th>
          <td mat-cell *matCellDef="let element">
            @if (isAdmin()) {
              <button mat-icon-button class="delete-match-button" type="button"
                [attr.aria-label]="'Delete match: ' + element.team1 + ' versus ' + element.team2 + ', ' + element.score"
                [disabled]="deletingMatchId !== null"
                (click)="confirmDelete(element)">
                <mat-icon>close</mat-icon>
              </button>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="isAdmin() ? adminColumnNames : columnNames"></tr>
        <tr mat-row *matRowDef="let row; columns: isAdmin() ? adminColumnNames : columnNames"></tr>
      </table>
      </div>

      @if (isAdmin()) {
      <mat-divider style="margin-top: 50px; margin-bottom: 50px;"></mat-divider>

      <h3>Add match result</h3>

      <form novalidate [formGroup]="options">
        <div class="row" style="padding-top: 15px">
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Team 1 Player 1</mat-label>
              <input matInput formControlName="team1Player1" [matAutocomplete]="team1Player1Auto" />
              <mat-autocomplete #team1Player1Auto="matAutocomplete" [displayWith]="displayPlayer">
                @for (item of filteredPlayers(team1Player1.value); track item.id) {
                  <mat-option [value]="item.id">{{ item.firstName }} {{ item.lastName }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          </div>
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Team 1 Player 2</mat-label>
              <input matInput formControlName="team1Player2" [matAutocomplete]="team1Player2Auto" />
              <mat-autocomplete #team1Player2Auto="matAutocomplete" [displayWith]="displayPlayer">
                @for (item of filteredPlayers(team1Player2.value); track item.id) {
                  <mat-option [value]="item.id">{{ item.firstName }} {{ item.lastName }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          </div>
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Team 1</mat-label>
              <input matInput formControlName="team1" [matAutocomplete]="team1Auto" />
              <mat-autocomplete #team1Auto="matAutocomplete" [displayWith]="displayTeam" (optionSelected)="chooseTeam(1, $event.option.value)">
                @for (item of filteredTeams(team1.value); track item.id) {
                  <mat-option [value]="item.id">{{ item.player1Name }}, {{ item.player2Name }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          </div>
        </div>
        <div class="row" style="padding-top: 15px">
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Team 2 Player 1</mat-label>
              <input matInput formControlName="team2Player1" [matAutocomplete]="team2Player1Auto" />
              <mat-autocomplete #team2Player1Auto="matAutocomplete" [displayWith]="displayPlayer">
                @for (item of filteredPlayers(team2Player1.value); track item.id) {
                  <mat-option [value]="item.id">{{ item.firstName }} {{ item.lastName }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          </div>
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Team 2 Player 2</mat-label>
              <input matInput formControlName="team2Player2" [matAutocomplete]="team2Player2Auto" />
              <mat-autocomplete #team2Player2Auto="matAutocomplete" [displayWith]="displayPlayer">
                @for (item of filteredPlayers(team2Player2.value); track item.id) {
                  <mat-option [value]="item.id">{{ item.firstName }} {{ item.lastName }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          </div>
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Team 2</mat-label>
              <input matInput formControlName="team2" [matAutocomplete]="team2Auto" />
              <mat-autocomplete #team2Auto="matAutocomplete" [displayWith]="displayTeam" (optionSelected)="chooseTeam(2, $event.option.value)">
                @for (item of filteredTeams(team2.value); track item.id) {
                  <mat-option [value]="item.id">{{ item.player1Name }}, {{ item.player2Name }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          </div>
        </div>
        <div class="row" style="padding-top: 15px">
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Team 1 Points</mat-label>
              <input
                matInput
                type="number"
                placeholder="Score 1"
                formControlName="team1Points"
              />
            </mat-form-field>
          </div>
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Team 2 Points</mat-label>
              <input
                matInput
                type="number"
                placeholder="Score 2"
                formControlName="team2Points"
              />
            </mat-form-field>
          </div>
        </div>


        <button type="submit" mat-flat-button (click)="create()">Create</button>
      </form>
      }
    </div>

    <ng-template #confirmDeleteDialog>
      <h2 mat-dialog-title>Delete match?</h2>
      <mat-dialog-content>
        <p>Delete {{ matchToDelete?.team1 }} vs {{ matchToDelete?.team2 }} ({{ matchToDelete?.score }})?</p>
        <p>This cannot be undone.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false">Cancel</button>
        <button mat-flat-button class="confirm-delete-button" [mat-dialog-close]="true">Delete match</button>
      </mat-dialog-actions>
    </ng-template>
  `,
  providers: [provideNativeDateAdapter()],
  styles: `
    .page-heading {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px 24px;
      margin: 8px 0 24px;
    }

    .page-heading h1 {
      margin: 0;
    }

    .back-to-trainings.mat-mdc-outlined-button {
      margin-left: auto;
      color: var(--mat-sys-primary);
      border-color: var(--mat-sys-primary);
      background-color: var(--mat-sys-primary-container);
    }

    .matches-table-scroll {
      overflow-x: auto;
    }

    .mat-column-actions {
      width: 56px;
      padding-right: 8px;
      text-align: right;
    }

    .delete-match-button {
      color: var(--mat-sys-primary);
    }

    .confirm-delete-button.mat-mdc-unelevated-button {
      background: var(--mat-sys-error);
      color: var(--mat-sys-on-error);
    }

    @media (min-width: 320px) {
        .col {
            width: 100%;
            display: -webkit-inline-box;
        }
    }

    @media (min-width: 600px) {
        .col {
            width: 30%;
            display: -webkit-inline-box;
        }
    }
  `,
})
export class TrainingDetailComponent {
  readonly authService = inject(AuthService)
  readonly isAdmin = toSignal(this.authService.isAdmin$, { initialValue: false })
  private readonly dialog = inject(MatDialog)
  @ViewChild('confirmDeleteDialog') confirmDeleteDialog?: TemplateRef<unknown>
  trainingId: string
  private scoreboardSort: Sort = { active: '', direction: '' }
  private matchSort: Sort = { active: '', direction: '' }

  sortScoreboard(sort: Sort): void {
    this.scoreboardSort = sort
    this.scoreboards$ = sortTableRows(this.scoreboards$, sort, scoreboardSortValue)
  }

  sortMatches(sort: Sort): void {
    this.matchSort = sort
    this.matches$ = sortTableRows(this.matches$, sort, this.matchSortValue)
  }

  private matchSortValue(row: TrainingDetailsMatch, column: string) {
    switch (column) {
      case 'team1': return row.team1
      case 'team2': return row.team2
      default: return [row.team1Points, row.team2Points]
    }
  }

  matches$: TrainingDetailsMatch[] = []
  scoreboards$: any[] = []
  playersData$: Player[] = []
  teamsData$: Team[] = []
  trainingData$?: Training = undefined
  columnNames: any[] = ['team1', 'team2', 'score']
  adminColumnNames: string[] = [...this.columnNames, 'actions']
  matchToDelete?: TrainingDetailsMatch
  deletingMatchId: string | null = null
  scoreboardColumnNames: any[] = ['name', 'sets', 'points', 'ratio']
  showSpinner: boolean = true
  attendingOptions: string[] = []

  constructor(
    private trainingService: TrainingService,
    private matchService: MatchService,
    private playerService: PlayerService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.trainingId = this.route.snapshot.params['id']
    this.reloadData()
  }

  readonly team1Player1 = new FormControl('')
  readonly team1Player2 = new FormControl('')
  readonly team1 = new FormControl('')
  readonly team2 = new FormControl('')
  readonly team2Player1 = new FormControl('')
  readonly team2Player2 = new FormControl('')
  readonly team1Points = new FormControl('21')
  readonly team2Points = new FormControl('')

  readonly options = inject(FormBuilder).group({
    team1Player1: this.team1Player1,
    team1Player2: this.team1Player2,
    team1: this.team1,
    team2: this.team2,
    team2Player1: this.team2Player1,
    team2Player2: this.team2Player2,
    team1Points: this.team1Points,
    team2Points: this.team2Points,
  })

  readonly displayPlayer = (id: string | null): string => {
    const player = this.playersData$.find(item => item.id === id)
    return player ? `${player.firstName} ${player.lastName}` : id ?? ''
  }

  filteredPlayers(value: string | null): Player[] {
    if (!value || this.playersData$.some(player => player.id === value)) {
      return this.playersData$
    }
    return this.playersData$.filter(player =>
      nameMatchesQuery(`${player.firstName} ${player.lastName}`, value)
    )
  }

  readonly displayTeam = (id: string | null): string => {
    const team = this.teamsData$.find(item => item.id === id)
    return team ? `${team.player1Name}, ${team.player2Name}` : id ?? ''
  }

  filteredTeams(value: string | null): Team[] {
    if (!value || this.teamsData$.some(team => team.id === value)) {
      return this.teamsData$
    }
    return this.teamsData$.filter(team =>
      nameMatchesQuery(`${team.player1Name} ${team.player2Name}`, value)
    )
  }

  chooseTeam(side: 1 | 2, teamId: string): void {
    const team = this.teamsData$.find(item => item.id === teamId)
    if (!team) return

    const player1 = side === 1 ? this.team1Player1 : this.team2Player1
    const player2 = side === 1 ? this.team1Player2 : this.team2Player2
    player1.setValue(team.player1Id, { emitEvent: false })
    player2.setValue(team.player2Id, { emitEvent: false })
    const teamControl = side === 1 ? this.team1 : this.team2
    teamControl.setValue('', { emitEvent: false })
  }

  create = async () => {
    let t1p1 = this.options.value.team1Player1 ?? ''
    let t1p2 = this.options.value.team1Player2 ?? ''
    let t2p1 = this.options.value.team2Player1 ?? ''
    let t2p2 = this.options.value.team2Player2 ?? ''

    if ([t1p1, t1p2, t2p1, t2p2].some(id => !this.playersData$.some(player => player.id === id))) {
      this.snackBar.open('Select all four players from the suggestions.', 'Close', { duration: 3000 })
      return
    }

    if (new Set([t1p1, t1p2, t2p1, t2p2]).size !== 4) {
      this.snackBar.open('Choose four different players.', 'Close', { duration: 3000 })
      return
    }

    const team1ScoreText = this.team1Points.value?.trim() ?? ''
    const team2ScoreText = this.team2Points.value?.trim() ?? ''
    const team1Score = Number(team1ScoreText)
    const team2Score = Number(team2ScoreText)
    if (!/^\d+$/.test(team1ScoreText) || !/^\d+$/.test(team2ScoreText)
      || team1Score === team2Score) {
      this.snackBar.open('Enter two different, non-negative whole-number scores.', 'Close', { duration: 4000 })
      return
    }

    let res = await this.matchService.create(
      this.trainingId,
      t1p1,
      t1p2,
      t2p1,
      t2p2,
      team1Score,
      team2Score
    )
    if (res) {
      this.options.reset()
      this.reloadData()
      this.team1Points.setValue('21', {
        emitEvent: false,
      })
      this.snackBar.open('Match was created', 'Close', {
        duration: 3000,
      })
    } else {
      this.snackBar.open('Could not create match. Check your sign-in and Firestore rules.', 'Close', { duration: 5000 })
    }
  }

  async confirmDelete(match: TrainingDetailsMatch): Promise<void> {
    if (!this.isAdmin() || !match.firestoreId || this.matchToDelete || this.deletingMatchId || !this.confirmDeleteDialog) return

    this.matchToDelete = match
    const confirmed = await firstValueFrom(this.dialog.open(this.confirmDeleteDialog, {
      width: '440px',
      maxWidth: 'calc(100vw - 32px)',
      role: 'alertdialog',
    }).afterClosed())
    this.matchToDelete = undefined
    if (confirmed !== true) return

    this.deletingMatchId = match.firestoreId
    try {
      await this.matchService.deleteMatch(match.firestoreId)
    } catch (error) {
      console.error('Could not delete match', error)
      this.snackBar.open('Could not delete match. Check your sign-in and Firestore rules.', 'Close', { duration: 5000 })
      this.deletingMatchId = null
      return
    }

    try {
      const [details, teams] = await Promise.all([
        this.trainingService.getTrainingDetails(this.trainingId),
        this.trainingService.getTeams(),
      ])
      this.matches$ = sortTableRows(details.matches, this.matchSort, this.matchSortValue)
      this.scoreboards$ = sortTableRows(details.scoreboards, this.scoreboardSort, scoreboardSortValue)
      this.teamsData$ = teams
      this.snackBar.open('Match deleted', 'Close', { duration: 3000 })
    } catch (error) {
      console.error('Could not refresh training after deleting match', error)
      this.snackBar.open('Match deleted. Refresh the page to update results.', 'Close', { duration: 5000 })
    } finally {
      this.deletingMatchId = null
    }
  }

  reloadData = () => {
    this.playerService.get().then((data) => {
      this.playersData$ = data.slice().sort((a, b) => {
        var fullname1 = `${b.firstName} ${b.lastName}`
        var fullname2 = `${a.firstName} ${a.lastName}`

        return fullname2.localeCompare(fullname1)
      })
    })

    this.trainingService.getById(this.trainingId).then((data) => {
      this.trainingData$ = data
    })

    this.trainingService.getTrainingDetails(this.trainingId).then((data) => {
      this.matches$ = sortTableRows(data.matches, this.matchSort, this.matchSortValue)
      this.scoreboards$ = sortTableRows(data.scoreboards, this.scoreboardSort, scoreboardSortValue)
    })

    this.trainingService.getTeams().then((data) => {
      this.teamsData$ = data
      this.showSpinner = false
    })
  }

  setTeam = (player1: string, player2: string) => {
    const t1p1 = this.team1Player1.value

    if (!t1p1) {
      this.team1Player1.setValue(player1, {
        emitEvent: false,
      })
      this.team1Player2.setValue(player2, {
        emitEvent: false,
      })
    } else {
      this.team2Player1.setValue(player1, {
        emitEvent: false,
      })
      this.team2Player2.setValue(player2, {
        emitEvent: false,
      })
    }
  }

  clearTeams = () => {
    this.team1Player1.setValue('', {
      emitEvent: false,
    })
    this.team1Player2.setValue('', {
      emitEvent: false,
    })
    this.team2Player1.setValue('', {
      emitEvent: false,
    })
    this.team2Player2.setValue('', {
      emitEvent: false,
    })
  }
}
