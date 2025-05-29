import { Component, inject } from '@angular/core'
import { KeyValuePipe, NgIf } from '@angular/common'
import { Player } from 'src/interfaces/player'
import { Attending } from 'src/interfaces/attending'
import { MatTableModule } from '@angular/material/table'
import { MatSelectModule } from '@angular/material/select'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { PlayerService } from '../player.service'
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
    MatSelectModule,
    KeyValuePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NgIf,
  ],
  template: `
    <div *ngIf="showSpinner">
      <mat-spinner></mat-spinner>
    </div>

    <div *ngIf="!showSpinner">
      <h1>Players</h1>
      <table mat-table [dataSource]="playersData$">
        <ng-container matColumnDef="firstName">
          <th mat-header-cell *matHeaderCellDef>Firstname</th>
          <td mat-cell *matCellDef="let element">{{ element.firstName }}</td>
        </ng-container>

        <ng-container matColumnDef="lastName">
          <th mat-header-cell *matHeaderCellDef>Lastname</th>
          <td mat-cell *matCellDef="let element">{{ element.lastName }}</td>
        </ng-container>

        <ng-container matColumnDef="attending">
          <th mat-header-cell *matHeaderCellDef>Attending</th>
          <td mat-cell *matCellDef="let element">{{ element.attending }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columnNames"></tr>
        <tr mat-row *matRowDef="let row; columns: columnNames"></tr>
      </table>

      <mat-divider style="margin-top: 50px; margin-bottom: 50px;"></mat-divider>

      <h3>Add player</h3>

      <form novalidate [formGroup]="applyForm">
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
        <div class="row">
          <div class="col">
            <mat-form-field appearance="outline">
              <mat-select placeholder="Select" formControlName="attending">
                @for (item of attendingOptions | keyvalue; track $index ){
                <mat-option value="{{ item.key }}">{{ item.value }}</mat-option>
                }
              </mat-select>
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
        <button type="submit" mat-flat-button (click)="submitNewPlayer()">
          Create
        </button>
      </form>
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
  playersData$: Player[] = []
  columnNames: any[] = ['firstName', 'lastName', 'attending']
  showSpinner: boolean = true
  attendingOptions: string[] = []
  applyForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    attending: new FormControl(''),
    password: new FormControl(''),
  })

  constructor(
    private snackBar: MatSnackBar,
    private playerService: PlayerService
  ) {
    this.reloadData()
  }

  ngOnInit() {
    this.attendingOptions = Object.keys(Attending).filter((v) =>
      isNaN(Number(v))
    )
  }

  submitNewPlayer = async () => {
    let attendingInt = this.applyForm.value.attending ?? '3'
    let attending: Attending = Attending[attendingInt as keyof typeof Attending]

    let res = await this.playerService.create(
      this.applyForm.value.firstName ?? '',
      this.applyForm.value.lastName ?? '',
      this.applyForm.value.password ?? '',
      attending
    )

    if (res) {
      this.applyForm.reset()
      this.reloadData()
      this.snackBar.open('Player was created')
    }
  }

  reloadData = () => {
    this.playerService.get().then((data) => {
      this.playersData$ = data
      this.showSpinner = false
    })
  }
}
