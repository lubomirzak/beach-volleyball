import { CurrencyPipe } from '@angular/common'
import { Component, TemplateRef, ViewChild, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { LoadingSpinnerComponent } from '../loading-spinner.component'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatSortModule, Sort } from '@angular/material/sort'
import { MatTableModule } from '@angular/material/table'
import { RouterModule } from '@angular/router'
import { FineDetails } from 'src/interfaces/fineDetails'
import { Player } from 'src/interfaces/player'
import { Training } from 'src/interfaces/training'
import { firstValueFrom } from 'rxjs'
import { AuthService } from '../auth.service'
import { FineService } from '../fine.service'
import { nameMatchesQuery } from '../name-search'
import { PaymentIbanComponent } from '../payment-iban/payment-iban.component'
import { PlayerService } from '../player.service'
import { sortTableRows, TableSortValue } from '../table-sort'
import { TrainingService } from '../training.service'

@Component({
  selector: 'app-fines',
  imports: [
    CurrencyPipe,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LoadingSpinnerComponent,
    MatSelectModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTableModule,
    PaymentIbanComponent,
    ReactiveFormsModule,
    RouterModule,
  ],
  template: `
    <h1>Fines</h1>
    <app-payment-iban />
    @if (showSpinner) {
      <app-loading-spinner label="Loading fines" />
    } @else if (error) {
      <p role="alert">{{ error }}</p>
      <button mat-stroked-button type="button" (click)="reloadData()">Try again</button>
    } @else {
      <div class="table-scroll">
        <table mat-table matSort [matSortActive]="fineSort.active" [matSortDirection]="fineSort.direction"
          [matSortDisableClear]="true" (matSortChange)="sortFines($event)" [dataSource]="finesData$">
          <ng-container matColumnDef="trainingDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Training</th>
            <td mat-cell *matCellDef="let row">
              <a [routerLink]="['/trainingdetail', row.trainingId]" class="training-link">
                {{ row.date.toDateString() }}
              </a>
            </td>
            <td mat-footer-cell *matFooterCellDef>Total</td>
          </ng-container>
          <ng-container matColumnDef="playerName">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Player</th>
            <td mat-cell *matCellDef="let row">{{ row.playerName }}</td>
            <td mat-footer-cell *matFooterCellDef></td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Amount</th>
            <td mat-cell *matCellDef="let row">{{ row.amount | currency:'EUR':'symbol':'1.2-2' }}</td>
            <td mat-footer-cell *matFooterCellDef>{{ totalAmount | currency:'EUR':'symbol':'1.2-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="paid">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Paid</th>
            <td mat-cell *matCellDef="let row">
              @if (isAdmin()) {
                <mat-slide-toggle [checked]="row.paid" [disabled]="savingFineId === row.firestoreId"
                  [attr.aria-label]="'Paid by ' + row.playerName"
                  (change)="togglePaid(row, $event)">{{ row.paid ? 'Yes' : 'No' }}</mat-slide-toggle>
              } @else {
                {{ row.paid ? 'Yes' : 'No' }}
              }
            </td>
            <td mat-footer-cell *matFooterCellDef></td>
          </ng-container>
          <ng-container matColumnDef="actions" stickyEnd>
            <th mat-header-cell *matHeaderCellDef aria-label="Fine actions"></th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button class="delete-button" type="button"
                [attr.aria-label]="'Delete fine for ' + row.playerName + ' on ' + row.date.toDateString()"
                [disabled]="deletingFineId !== null || savingFineId !== null"
                (click)="confirmDelete(row)">
                <mat-icon>close</mat-icon>
              </button>
            </td>
            <td mat-footer-cell *matFooterCellDef></td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="isAdmin() ? adminColumns : columns"></tr>
          <tr mat-row *matRowDef="let row; columns: isAdmin() ? adminColumns : columns"></tr>
          @if (finesData$.length > 0) {
            <tr mat-footer-row *matFooterRowDef="isAdmin() ? adminColumns : columns"></tr>
          }
        </table>
      </div>
      @if (finesData$.length === 0) {
        <p>No fines recorded this season.</p>
      }

      @if (isAdmin()) {
        <section class="new-payment">
          <h2>Add fine</h2>
          <form [formGroup]="form" (ngSubmit)="create()">
            <div class="form-fields">
              <mat-form-field appearance="outline">
                <mat-label>Player</mat-label>
                <input matInput formControlName="playerId" [matAutocomplete]="playerAutocomplete" />
                <mat-autocomplete #playerAutocomplete="matAutocomplete" [displayWith]="displayPlayer">
                  @for (player of filteredPlayers(form.controls.playerId.value); track player.id) {
                    <mat-option [value]="player.id">{{ player.lastName.toLocaleUpperCase() }} {{ player.firstName }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Training</mat-label>
                <mat-select formControlName="trainingId">
                  @for (training of trainingsData$; track training.id) {
                    <mat-option [value]="training.id">{{ training.date.toDateString() }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Amount (€)</mat-label>
                <input matInput type="number" min="0.01" step="0.01" formControlName="amount" />
              </mat-form-field>
            </div>
            <button mat-flat-button type="submit" [disabled]="creating">Add fine</button>
          </form>
        </section>
      }
    }

    <ng-template #confirmDeleteDialog>
      <h2 mat-dialog-title>Delete fine?</h2>
      <mat-dialog-content>
        <p>Delete {{ fineToDelete?.playerName }}'s fine from {{ fineToDelete?.date?.toDateString() }}
          ({{ fineToDelete?.amount | currency:'EUR':'symbol':'1.2-2' }})?</p>
        <p>This cannot be undone.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false">Cancel</button>
        <button mat-flat-button class="confirm-delete-button" [mat-dialog-close]="true">Delete fine</button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: `
    .table-scroll { overflow-x: auto; }
    table { width: 100%; min-width: 620px; }
    .mat-mdc-footer-row { font-weight: 700; background: var(--mat-sys-surface-container); }
    .mat-mdc-footer-cell { border-top: 2px solid var(--mat-sys-outline-variant); }
    .new-payment { margin-top: 48px; }
    .form-fields { display: flex; flex-wrap: wrap; gap: 12px; }
    .form-fields mat-form-field { flex: 1 1 200px; }
    .training-link, .delete-button { color: var(--mat-sys-primary); }
    .mat-column-actions { width: 56px; padding-right: 8px; text-align: right; }
    .confirm-delete-button.mat-mdc-unelevated-button {
      background: var(--mat-sys-error);
      color: var(--mat-sys-on-error);
    }
  `,
})
export class FinesComponent {
  private readonly authService = inject(AuthService)
  private readonly trainingService = inject(TrainingService)
  private readonly playerService = inject(PlayerService)
  private readonly fineService = inject(FineService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly dialog = inject(MatDialog)

  @ViewChild('confirmDeleteDialog') confirmDeleteDialog?: TemplateRef<unknown>
  readonly isAdmin = toSignal(this.authService.isAdmin$, { initialValue: false })
  readonly columns = ['trainingDate', 'playerName', 'amount', 'paid']
  readonly adminColumns = [...this.columns, 'actions']
  readonly form = new FormGroup({
    playerId: new FormControl('', { nonNullable: true }),
    trainingId: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(null),
  })

  finesData$: FineDetails[] = []
  get totalAmount(): number {
    return this.finesData$.reduce((cents, fine) => cents + Math.round(fine.amount * 100), 0) / 100
  }
  playersData$: Player[] = []
  trainingsData$: Training[] = []
  fineSort: Sort = { active: '', direction: '' }
  showSpinner = true
  creating = false
  savingFineId: string | null = null
  deletingFineId: string | null = null
  fineToDelete?: FineDetails
  error = ''

  constructor() {
    void this.reloadData()
  }

  readonly displayPlayer = (id: string | null): string => {
    const player = this.playersData$.find(item => item.id === id)
    return player ? `${player.lastName.toLocaleUpperCase()} ${player.firstName}` : id ?? ''
  }

  filteredPlayers(value: string | null): Player[] {
    if (!value || this.playersData$.some(player => player.id === value)) return this.playersData$
    return this.playersData$.filter(player =>
      nameMatchesQuery(`${player.firstName} ${player.lastName}`, value)
    )
  }

  sortFines(sort: Sort): void {
    this.fineSort = sort
    this.finesData$ = sortTableRows(this.finesData$, sort, this.fineSortValue)
  }

  private fineSortValue(row: FineDetails, column: string): TableSortValue {
    switch (column) {
      case 'trainingDate': return row.date
      case 'playerName': return row.playerName
      case 'amount': return row.amount
      default: return Number(row.paid)
    }
  }

  async reloadData(): Promise<void> {
    this.showSpinner = true
    this.error = ''
    try {
      const [fines, players, trainings] = await Promise.all([
        this.fineService.get(),
        this.playerService.get(),
        this.trainingService.get(),
      ])
      this.finesData$ = sortTableRows(fines, this.fineSort, this.fineSortValue)
      this.playersData$ = players
      this.trainingsData$ = trainings
      if (!trainings.some(training => training.id === this.form.controls.trainingId.value)) {
        this.form.controls.trainingId.setValue(trainings[0]?.id ?? '')
      }
    } catch (error) {
      console.error('Could not load fines', error)
      this.error = 'Could not load fines.'
    } finally {
      this.showSpinner = false
    }
  }

  async create(): Promise<void> {
    if (!this.isAdmin() || this.creating) return
    const { playerId, trainingId, amount } = this.form.getRawValue()
    if (!this.playersData$.some(player => player.id === playerId)
      || !this.trainingsData$.some(training => training.id === trainingId)) {
      this.snackBar.open('Choose a player and training.', 'Close', { duration: 3000 })
      return
    }
    if (amount === null || !Number.isFinite(amount) || amount <= 0
      || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-8) {
      this.snackBar.open('Enter a positive amount in euros and cents.', 'Close', { duration: 3000 })
      return
    }

    this.creating = true
    try {
      const result = await this.fineService.create(playerId, trainingId, amount)
      if (!result) {
        this.snackBar.open('Could not add fine. Check your sign-in and Firestore rules.', 'Close', { duration: 5000 })
        return
      }
      this.form.reset({ playerId: '', trainingId: '', amount: null })
      this.snackBar.open('Fine added.', 'Close', { duration: 3000 })
      await this.reloadData()
    } finally {
      this.creating = false
    }
  }

  async togglePaid(row: FineDetails, event: MatSlideToggleChange): Promise<void> {
    if (!this.isAdmin() || this.savingFineId || this.deletingFineId) {
      event.source.checked = row.paid
      return
    }
    const previous = row.paid
    row.paid = event.checked
    this.savingFineId = row.firestoreId
    try {
      await this.fineService.setPaid(row.firestoreId, row.paid)
    } catch (error) {
      console.error('Could not update fine', error)
      row.paid = previous
      event.source.checked = previous
      this.snackBar.open('Could not update paid status.', 'Close', { duration: 5000 })
    } finally {
      this.savingFineId = null
      this.finesData$ = sortTableRows(this.finesData$, this.fineSort, this.fineSortValue)
    }
  }

  async confirmDelete(row: FineDetails): Promise<void> {
    if (!this.isAdmin() || this.fineToDelete || this.deletingFineId || this.savingFineId
      || !this.confirmDeleteDialog) return
    this.fineToDelete = row
    const confirmed = await firstValueFrom(this.dialog.open(this.confirmDeleteDialog, {
      width: '440px',
      maxWidth: 'calc(100vw - 32px)',
      role: 'alertdialog',
    }).afterClosed())
    this.fineToDelete = undefined
    if (confirmed !== true) return

    this.deletingFineId = row.firestoreId
    try {
      await this.fineService.delete(row.firestoreId)
      this.finesData$ = this.finesData$.filter(fine => fine.firestoreId !== row.firestoreId)
      this.snackBar.open('Fine deleted.', 'Close', { duration: 3000 })
    } catch (error) {
      console.error('Could not delete fine', error)
      this.snackBar.open('Could not delete fine.', 'Close', { duration: 5000 })
    } finally {
      this.deletingFineId = null
    }
  }
}
