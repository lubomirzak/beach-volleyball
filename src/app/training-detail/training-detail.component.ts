import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NgIf } from '@angular/common'
import { MatTableModule } from '@angular/material/table'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { TrainingService } from '../training.service'
import { MatchService } from '../match.service'
import { AuthService } from '../auth.service'
import { PlayerService } from '../player.service'
import { FormControl, ReactiveFormsModule, FormBuilder } from '@angular/forms'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { provideNativeDateAdapter } from '@angular/material/core'
import { RouterModule } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { Training } from 'src/interfaces/training'
import { Team } from 'src/interfaces/team'
import { Match } from 'src/interfaces/match'
import { Player } from 'src/interfaces/player'

@Component({
  selector: 'app-training-detail',
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    NgIf,
    RouterModule,
    CommonModule,
  ],
  template: `
    <div *ngIf="showSpinner">
      <mat-spinner></mat-spinner>
    </div>

    <div *ngIf="!showSpinner">
      <h1>
        Training from
        {{ this.trainingData$ ? this.trainingData$.date.toDateString() : '' }}
      </h1>

      <h3 style="padding-top: 30px">Results</h3>

      <div style="width: 30%; ">
        <table mat-table [dataSource]="scoreboards$">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Player</th>
            <td mat-cell *matCellDef="let element">{{ element.name }}</td>
          </ng-container>

          <ng-container matColumnDef="sets">
            <th mat-header-cell *matHeaderCellDef>Sets</th>
            <td mat-cell *matCellDef="let element">{{ element.sets }}</td>
          </ng-container>

          <ng-container matColumnDef="points">
            <th mat-header-cell *matHeaderCellDef>Points</th>
            <td mat-cell *matCellDef="let element">{{ element.points }}</td>
          </ng-container>

          <ng-container matColumnDef="ratio">
            <th mat-header-cell *matHeaderCellDef>Ratio</th>
            <td mat-cell *matCellDef="let element">{{ element.ratio }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="scoreboardColumnNames"></tr>
          <tr mat-row *matRowDef="let row; columns: scoreboardColumnNames"></tr>
        </table>
      </div>

      <h3>Matches</h3>
      <table mat-table [dataSource]="matches$">
        <ng-container matColumnDef="team1">
          <th mat-header-cell *matHeaderCellDef>Team 1</th>
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
          <th mat-header-cell *matHeaderCellDef>Team 2</th>
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
          <th mat-header-cell *matHeaderCellDef>Score</th>
          <td mat-cell *matCellDef="let element">{{ element.score }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columnNames"></tr>
        <tr mat-row *matRowDef="let row; columns: columnNames"></tr>
      </table>

      @if (authService.isAdmin$ | async) {
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
  `,
  providers: [provideNativeDateAdapter()],
  styles: `
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
  trainingId: string
  matches$: any[] = []
  scoreboards$: any[] = []
  playersData$: Player[] = []
  teamsData$: Team[] = []
  trainingData$?: Training = undefined
  columnNames: any[] = ['team1', 'team2', 'score']
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
    const search = value.trim().toLocaleLowerCase()
    return this.playersData$.filter(player =>
      `${player.firstName} ${player.lastName}`.toLocaleLowerCase().includes(search)
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
    const search = value.trim().toLocaleLowerCase()
    return this.teamsData$.filter(team =>
      `${team.player1Name} ${team.player2Name}`.toLocaleLowerCase().includes(search)
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

    let res = await this.matchService.create(
      this.trainingId,
      t1p1,
      t1p2,
      t2p1,
      t2p2,
      parseInt(this.options.value.team1Points ?? '0'),
      parseInt(this.options.value.team2Points ?? '0')
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

  reloadData = () => {
    this.playerService.get().then((data) => {
      this.playersData$ = data.sort((a, b) => {
        var fullname1 = `${b.firstName} ${b.lastName}`
        var fullname2 = `${a.firstName} ${a.lastName}`

        return fullname2.localeCompare(fullname1)
      })
    })

    this.trainingService.getById(this.trainingId).then((data) => {
      this.trainingData$ = data
    })

    this.trainingService.getTrainingDetails(this.trainingId).then((data) => {
      this.matches$ = data.matches
      this.scoreboards$ = data.scoreboards
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
