import { Component } from '@angular/core'
import { KeyValuePipe, NgIf } from '@angular/common'
import { Attending } from 'src/interfaces/attending'
import { MatTableModule } from '@angular/material/table'
import { MatSelectModule } from '@angular/material/select'
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

@Component({
  selector: 'app-trainings',
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    KeyValuePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    NgIf,
    RouterModule,
  ],
  template: `
    <h1>Trainings</h1>
    <div *ngIf="showSpinner">
      <mat-spinner></mat-spinner>
    </div>

    <div *ngIf="!showSpinner">
      <table mat-table [dataSource]="trainingsData$">
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let element">
            <a
              [routerLink]="['/trainingdetail', element.id]"
              style="color: var(--mat-sys-primary)"
              >{{ element.date.toDateString() }}</a
            >
          </td>
        </ng-container>

        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let element">{{ element.type }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columnNames"></tr>
        <tr mat-row *matRowDef="let row; columns: columnNames"></tr>
      </table>

      <mat-divider style="margin-top: 50px; margin-bottom: 50px;"></mat-divider>

      <h3>Add training</h3>
      <form novalidate [formGroup]="applyForm">
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
        <div class="row" style="padding-top: 15px">
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-select placeholder="Select type" formControlName="type">
                @for (item of attendingOptions | keyvalue; track $index ){
                <mat-option value="{{ item.key }}">{{ item.value }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>
        <button type="submit" mat-flat-button (click)="create()">Create</button>
      </form>
    </div>
  `,
  providers: [provideNativeDateAdapter()],
})
export class TrainingsComponent {
  trainingsData$: any[] = []
  columnNames: any[] = ['date', 'type']
  showSpinner: boolean = true
  attendingOptions: string[] = []
  applyForm = new FormGroup({
    date: new FormControl(''),
    type: new FormControl(''),
  })

  constructor(
    private trainingService: TrainingService,
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
    let attendingInt = this.applyForm.value.type ?? '0'
    let attending: Attending = Attending[attendingInt as keyof typeof Attending]

    let res = await this.trainingService.create(
      this.applyForm.value.date ?? '',
      attending
    )

    if (res) {
      this.applyForm.reset()
      this.reloadData()
      this.snackBar.open('Training was created')
    }
  }

  reloadData = () => {
    this.trainingService.get().then((data) => {
      this.trainingsData$ = data.map((x) => {
        return {
          id: x.id,
          type: x.type,
          date: x.date,
        }
      })
      this.showSpinner = false
    })
  }
}
