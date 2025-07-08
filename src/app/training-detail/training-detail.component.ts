import { Component, inject, AfterViewInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NgIf } from '@angular/common'
import { MatTableModule } from '@angular/material/table'
import { MatSelectModule } from '@angular/material/select'
import { MatInputModule } from '@angular/material/input'
import {
  MatFormFieldModule,
  FloatLabelType,
} from '@angular/material/form-field'
import { TrainingService } from '../training.service'
import { MatchService } from '../match.service'
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
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs/operators'
import { Training } from 'src/interfaces/training'
import { Team } from 'src/interfaces/team'

@Component({
  selector: 'app-training-detail',
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
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
          <td mat-cell *matCellDef="let element">{{ element.team1 }}</td>
        </ng-container>

        <ng-container matColumnDef="team2">
          <th mat-header-cell *matHeaderCellDef>Team 2</th>
          <td mat-cell *matCellDef="let element">{{ element.team2 }}</td>
        </ng-container>

        <ng-container matColumnDef="score">
          <th mat-header-cell *matHeaderCellDef>Score</th>
          <td mat-cell *matCellDef="let element">{{ element.score }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columnNames"></tr>
        <tr mat-row *matRowDef="let row; columns: columnNames"></tr>
      </table>

      <mat-divider style="margin-top: 50px; margin-bottom: 50px;"></mat-divider>

      <h3>Add match result</h3>

      <form novalidate [formGroup]="options">
        <div class="row" style="padding-top: 15px">
          <div class="col">
            <mat-form-field appearance="outline" [floatLabel]="floatLabel1()">
              <mat-label>Team 1 Player 1</mat-label>
              <mat-select placeholder="Player 1" formControlName="team1Player1">
                @for (item of playersData$; track $index ){
                <mat-option value="{{ item.id }}"
                  >{{ item.firstName }} {{ item.lastName }}</mat-option
                >
                }
              </mat-select>
            </mat-form-field>
          </div>
          <div class="col">
            <mat-form-field appearance="outline" [floatLabel]="floatLabel2()">
              <mat-label>Team 1 Player 2</mat-label>
              <mat-select placeholder="Player 2" formControlName="team1Player2">
                @for (item of playersData$; track $index ){
                <mat-option value="{{ item.id }}"
                  >{{ item.firstName }} {{ item.lastName }}</mat-option
                >
                }
              </mat-select>
            </mat-form-field>
          </div>
          <div class="col">
             <mat-form-field appearance="outline" [floatLabel]="floatLabel22()">
              <mat-label>Team 1</mat-label>
              <mat-select placeholder="Team 1" formControlName="team1">
                @for (item of teamsData$; track $index ){
                <mat-option value="{{ item.id }}"
                  >{{ item.player1Name }}, {{ item.player2Name }}</mat-option
                >
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>
        <div class="row" style="padding-top: 15px">
          <div class="col">
            <mat-form-field appearance="outline" [floatLabel]="floatLabel3()">
              <mat-label>Team 2 Player 1</mat-label>
              <mat-select placeholder="Player 1" formControlName="team2Player1">
                @for (item of playersData$; track $index ){
                <mat-option value="{{ item.id }}"
                  >{{ item.firstName }} {{ item.lastName }}</mat-option
                >
                }
              </mat-select>
            </mat-form-field>
          </div>
          <div class="col">
            <mat-form-field appearance="outline" [floatLabel]="floatLabel4()">
              <mat-label>Team 2 Player 2</mat-label>
              <mat-select placeholder="Player 2" formControlName="team2Player2">
                @for (item of playersData$; track $index ){
                <mat-option value="{{ item.id }}"
                  >{{ item.firstName }} {{ item.lastName }}</mat-option
                >
                }
              </mat-select>
            </mat-form-field>
          </div>
             <div class="col">
             <mat-form-field appearance="outline" [floatLabel]="floatLabel44()">
              <mat-label>Team 2</mat-label>
              <mat-select placeholder="Team 2" formControlName="team2">
                @for (item of teamsData$; track $index ){
                <mat-option value="{{ item.id }}"
                  >{{ item.player1Name }}, {{ item.player2Name }}</mat-option
                >
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>
        <div class="row" style="padding-top: 15px">
          <div class="col">
            <mat-form-field appearance="outline" [floatLabel]="floatLabel5()">
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
            <mat-form-field appearance="outline" [floatLabel]="floatLabel6()">
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

        <div class="row" style="padding-top: 15px">
          <div class="col">
            <mat-form-field appearance="outline">
              <input
                matInput
                placeholder="Password"
                formControlName="password"
              />
            </mat-form-field>
          </div>
        </div>

        <button type="submit" mat-flat-button (click)="create()">Create</button>
      </form>
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
  trainingId: string
  matches$: any[] = []
  scoreboards$: any[] = []
  playersData$: any[] = []
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

  readonly team1Player1 = new FormControl('' as FloatLabelType)
  readonly team1Player2 = new FormControl('' as FloatLabelType)
  readonly team1 = new FormControl('' as FloatLabelType)
  readonly team2 = new FormControl('' as FloatLabelType)
  readonly team2Player1 = new FormControl('' as FloatLabelType)
  readonly team2Player2 = new FormControl('' as FloatLabelType)
  readonly team1Points = new FormControl('21' as FloatLabelType)
  readonly team2Points = new FormControl('' as FloatLabelType)
  readonly password = new FormControl('' as FloatLabelType)

  readonly options = inject(FormBuilder).group({
    team1Player1: this.team1Player1,
    team1Player2: this.team1Player2,
    team1: this.team1,
    team2: this.team2,
    team2Player1: this.team2Player1,
    team2Player2: this.team2Player2,
    team1Points: this.team1Points,
    team2Points: this.team2Points,
    password: this.password,
  })

  protected readonly floatLabel1 = toSignal(
    this.team1Player1.valueChanges.pipe(map((v) => v || 'auto')),
    { initialValue: 'auto' }
  )
  protected readonly floatLabel2 = toSignal(
    this.team2Player1.valueChanges.pipe(map((v) => v || 'auto')),
    { initialValue: 'auto' }
  )
  protected readonly floatLabel22 = toSignal(
    this.team1.valueChanges.pipe(map((v) => v || 'auto')),
    { initialValue: 'auto' }
  )
  protected readonly floatLabel3 = toSignal(
    this.team1Player2.valueChanges.pipe(map((v) => v || 'auto')),
    { initialValue: 'auto' }
  )
  protected readonly floatLabel4 = toSignal(
    this.team2Player2.valueChanges.pipe(map((v) => v || 'auto')),
    { initialValue: 'auto' }
  )
  protected readonly floatLabel44 = toSignal(
    this.team1.valueChanges.pipe(map((v) => v || 'auto')),
    { initialValue: 'auto' }
  )
  protected readonly floatLabel5 = toSignal(
    this.team1Points.valueChanges.pipe(map((v) => v || 'auto')),
    { initialValue: 'auto' }
  )
  protected readonly floatLabel6 = toSignal(
    this.team2Points.valueChanges.pipe(map((v) => v || 'auto')),
    { initialValue: 'auto' }
  )

    ngAfterViewInit() {
      // this.form.get('email').valueChanges.subscribe(val => {
      //   this.formattedMessage = `Email is: ${val}.`;
      //   console.log(this.formattedMessage);
      // });


      this.options.valueChanges.subscribe((x) => {
        console.log(x);

        if (x.team1) {

          let players = x.team1.split("###");

          this.team1Player1.setValue(players[0] as FloatLabelType, { emitEvent: false });
          this.team1Player2.setValue(players[1] as FloatLabelType, { emitEvent: false });
          this.team1.setValue('' as FloatLabelType, {emitEvent: false});
        }

        if (x.team2) {

          let players = x.team2.split("###");

          this.team2Player1.setValue(players[0] as FloatLabelType, { emitEvent: false });
          this.team2Player2.setValue(players[1] as FloatLabelType, { emitEvent: false });
          this.team2.setValue('' as FloatLabelType, {emitEvent: false});
        }
      });

//       this.options.get('team1')?.valueChanges.subscribe((x) => {
// console.log(x);
//       });
  }

  create = async () => {
    let res = await this.matchService.create(
      this.trainingId,
      this.options.value.team1Player1 ?? '',
      this.options.value.team1Player2 ?? '',
      this.options.value.team2Player1 ?? '',
      this.options.value.team2Player2 ?? '',
      parseInt(this.options.value.team1Points ?? '0'),
      parseInt(this.options.value.team2Points ?? '0'),
      this.options.value.password ?? ''
    )
    if (res) {
      this.options.reset()
      this.reloadData()
      this.snackBar.open('Match was created', 'Close', {
        duration: 3000,
      })
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
}
