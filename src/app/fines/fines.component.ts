import { Component } from '@angular/core'
import { NgIf } from '@angular/common'
import { Attending } from 'src/interfaces/attending'
import { MatTableModule } from '@angular/material/table'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { TrainingService } from '../training.service'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { provideNativeDateAdapter } from '@angular/material/core'
import { RouterModule } from '@angular/router'
import { PlayerService } from '../player.service'
import { MatSelectModule } from '@angular/material/select'
import { FineService } from '../fine.service'
import { FineDetails } from 'src/interfaces/fineDetails'

@Component({
  selector: 'app-fines',
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
  ],
  template: `
    <h1>Fines</h1>
    <div *ngIf="showSpinner">
      <mat-spinner></mat-spinner>
    </div>

    <div *ngIf="!showSpinner">
      <table mat-table [dataSource]="finesData$">
        <ng-container matColumnDef="trainingDate">
          <th mat-header-cell *matHeaderCellDef>Training</th>
          <td mat-cell *matCellDef="let element">
            <a
              [routerLink]="['/trainingdetail', element.trainingId]"
              style="color: var(--mat-sys-primary)"
              >{{ element.date.toDateString() }}</a
            >
          </td>
        </ng-container>

        <ng-container matColumnDef="playerName">
          <th mat-header-cell *matHeaderCellDef>Player</th>
          <td mat-cell *matCellDef="let element">{{ element.playerName }}</td>
        </ng-container>

        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>Amount</th>
          <td mat-cell *matCellDef="let element">{{ element.amountString }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columnNames"></tr>
        <tr mat-row *matRowDef="let row; columns: columnNames"></tr>
      </table>

      <mat-divider style="margin-top: 50px; margin-bottom: 50px;"></mat-divider>

      <h3>Add fine</h3>
      <form novalidate [formGroup]="applyForm">
        <div class="row">
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Player</mat-label>
              <mat-select placeholder="Player" formControlName="playerId">
                @for (item of playersData$; track $index ){
                <mat-option value="{{ item.id }}"
                  >{{ item.firstName }} {{ item.lastName }}</mat-option
                >
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Training</mat-label>
              <mat-select placeholder="Training" formControlName="trainingId">
                @for (item of trainingsData$; track $index ){
                <mat-option value="{{ item.id }}">{{
                  item.dateFormatted
                }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-label>Amount</mat-label>
              <input
                matInput
                type="number"
                placeholder="Amount"
                formControlName="amount"
              />
            </mat-form-field>
          </div>
        </div>
        <div class="row">
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
})
export class FinesComponent {
  finesData$: FineDetails[] = []
  trainingsData$: any[] = []
  playersData$: any[] = []
  columnNames: any[] = ['trainingDate', 'playerName', 'amount']
  showSpinner: boolean = true
  attendingOptions: string[] = []
  applyForm = new FormGroup({
    amount: new FormControl(''),
    playerId: new FormControl(''),
    trainingId: new FormControl(''),
    password: new FormControl(''),
  })

  constructor(
    private trainingService: TrainingService,
    private playerService: PlayerService,
    private fineService: FineService,
    private snackBar: MatSnackBar
  ) {
    this.reloadData()
  }

  ngOnInit() {
    this.attendingOptions = Object.keys(Attending).filter(
      (v) => isNaN(Number(v)) && (v == 'Thursday' || v == 'Tuesday')
    )
  }

  create = async () => {
    let res = await this.fineService.create(
      this.applyForm.value.playerId ?? '',
      this.applyForm.value.trainingId ?? '',
      this.applyForm.value.password ?? '',
      parseInt(this.applyForm.value.amount ?? '0')
    )
    if (res) {
      this.reloadData()
      this.snackBar.open('Fine was created', 'Close', {
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

    this.trainingService.get().then((data) => {
      this.trainingsData$ = data.map((x) => {
        return {
          id: x.id,
          type: x.type,
          date: x.date,
          dateFormatted: x.date.toDateString(),
        }
      })
    })

    this.fineService.get().then((data) => {
      this.finesData$ = data
      this.showSpinner = false
    })
  }
}
