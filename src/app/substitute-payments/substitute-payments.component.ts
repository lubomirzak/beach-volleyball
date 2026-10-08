import { CurrencyPipe } from '@angular/common'
import { Component, TemplateRef, ViewChild, effect, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatSortModule, Sort } from '@angular/material/sort'
import { MatTableModule } from '@angular/material/table'
import { Player } from 'src/interfaces/player'
import { SubstitutePaymentRow } from 'src/interfaces/substitutePayment'
import { Training } from 'src/interfaces/training'
import { firstValueFrom } from 'rxjs'
import { AuthService } from '../auth.service'
import { nameMatchesQuery } from '../name-search'
import { PaymentIbanComponent } from '../payment-iban/payment-iban.component'
import { PlayerService } from '../player.service'
import { sortTableRows, TableSortValue } from '../table-sort'
import { SubstitutePaymentService } from '../substitute-payment.service'
import { TrainingService } from '../training.service'

@Component({
  selector: 'app-substitute-payments',
  imports: [
    CurrencyPipe,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTableModule,
    PaymentIbanComponent,
    ReactiveFormsModule,
  ],
  template: `
    <h1>Substitute payments</h1>
    <app-payment-iban />

    @if (isAdmin() === undefined) {
      <mat-spinner></mat-spinner>
    } @else if (!isAdmin()) {
      <p>Only the admin can view substitute payments.</p>
    } @else if (loading) {
      <mat-spinner></mat-spinner>
    } @else if (error) {
      <p role="alert">{{ error }}</p>
      <button mat-stroked-button type="button" (click)="reloadData()">Try again</button>
    } @else {
      <div class="table-scroll">
        <table mat-table matSort [matSortActive]="sort.active" [matSortDirection]="sort.direction"
          [matSortDisableClear]="true" (matSortChange)="sortPayments($event)"
          [dataSource]="rows">
          <ng-container matColumnDef="playerName">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Player</th>
            <td mat-cell *matCellDef="let row">{{ row.playerName }}</td>
            <td mat-footer-cell *matFooterCellDef>Total</td>
          </ng-container>
          <ng-container matColumnDef="trainingDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Training</th>
            <td mat-cell *matCellDef="let row">
              {{ row.trainingDate?.toDateString() || 'Unknown training' }}
            </td>
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
              <mat-slide-toggle [checked]="row.paid" [disabled]="savingPaymentId !== null || deletingPaymentId !== null"
                [attr.aria-label]="'Paid by ' + row.playerName"
                (change)="togglePaid(row, $event)">{{ row.paid ? 'Yes' : 'No' }}</mat-slide-toggle>
            </td>
            <td mat-footer-cell *matFooterCellDef></td>
          </ng-container>
          <ng-container matColumnDef="actions" stickyEnd>
            <th mat-header-cell *matHeaderCellDef aria-label="Payment actions"></th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button class="delete-button" type="button"
                [attr.aria-label]="'Delete payment for ' + row.playerName"
                [disabled]="deletingPaymentId !== null || savingPaymentId !== null"
                (click)="confirmDelete(row)">
                <mat-icon>close</mat-icon>
              </button>
            </td>
            <td mat-footer-cell *matFooterCellDef></td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          @if (rows.length > 0) {
            <tr mat-footer-row *matFooterRowDef="columns"></tr>
          }
        </table>
      </div>
      @if (rows.length === 0) {
        <p>No substitute payments recorded this season.</p>
      }

      <section class="new-payment">
        <h2>Add substitute payment</h2>
        <form [formGroup]="form" (ngSubmit)="createPayment()">
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
                @for (training of trainings; track training.id) {
                  <mat-option [value]="training.id">{{ training.date.toDateString() }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Amount (€)</mat-label>
              <input matInput type="number" min="0.01" step="0.01" formControlName="amount" />
            </mat-form-field>
          </div>
          <button mat-flat-button type="submit" [disabled]="creating">Add payment</button>
        </form>
      </section>
    }

    <ng-template #confirmDeleteDialog>
      <h2 mat-dialog-title>Delete substitute payment?</h2>
      <mat-dialog-content>
        <p>Delete {{ paymentToDelete?.playerName }}'s payment from
          {{ paymentToDelete?.trainingDate?.toDateString() || 'this training' }}
          ({{ paymentToDelete?.amount | currency:'EUR':'symbol':'1.2-2' }})?</p>
        <p>This cannot be undone.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false">Cancel</button>
        <button mat-flat-button class="confirm-delete-button" [mat-dialog-close]="true">Delete payment</button>
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
    .delete-button { color: var(--mat-sys-primary); }
    .mat-column-actions { width: 56px; padding-right: 8px; text-align: right; }
    .confirm-delete-button.mat-mdc-unelevated-button {
      background: var(--mat-sys-error);
      color: var(--mat-sys-on-error);
    }
  `,
})
export class SubstitutePaymentsComponent {
  private readonly authService = inject(AuthService)
  private readonly paymentService = inject(SubstitutePaymentService)
  private readonly playerService = inject(PlayerService)
  private readonly trainingService = inject(TrainingService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly dialog = inject(MatDialog)

  @ViewChild('confirmDeleteDialog') confirmDeleteDialog?: TemplateRef<unknown>
  readonly isAdmin = toSignal(this.authService.isAdmin$)
  readonly columns = ['playerName', 'trainingDate', 'amount', 'paid', 'actions']
  readonly form = new FormGroup({
    playerId: new FormControl('', { nonNullable: true }),
    trainingId: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(5),
  })

  rows: SubstitutePaymentRow[] = []
  get totalAmount(): number {
    return this.rows.reduce((cents, payment) => cents + Math.round(payment.amount * 100), 0) / 100
  }
  players: Player[] = []
  trainings: Training[] = []
  loading = true
  creating = false
  savingPaymentId: string | null = null
  deletingPaymentId: string | null = null
  paymentToDelete?: SubstitutePaymentRow
  error = ''
  private loaded = false
  sort: Sort = { active: '', direction: '' }

  readonly displayPlayer = (id: string | null): string => {
    const player = this.players.find(item => item.id === id)
    return player ? `${player.lastName.toLocaleUpperCase()} ${player.firstName}` : id ?? ''
  }

  filteredPlayers(value: string | null): Player[] {
    if (!value || this.players.some(player => player.id === value)) return this.players
    return this.players.filter(player =>
      nameMatchesQuery(`${player.firstName} ${player.lastName}`, value)
    )
  }

  constructor() {
    effect(() => {
      if (this.isAdmin() === true && !this.loaded) {
        this.loaded = true
        void this.reloadData()
      }
    })
  }

  async reloadData(): Promise<void> {
    this.loading = true
    this.error = ''
    try {
      const [rows, players, trainings] = await Promise.all([
        this.paymentService.get(),
        this.playerService.get(),
        this.trainingService.get(),
      ])
      this.rows = sortTableRows(rows, this.sort, this.sortValue)
      this.players = players
      this.trainings = trainings
    } catch (error) {
      console.error('Could not load substitute payments', error)
      this.error = 'Could not load substitute payments.'
    } finally {
      this.loading = false
    }
  }

  sortPayments(sort: Sort): void {
    this.sort = sort
    this.rows = sortTableRows(this.rows, sort, this.sortValue)
  }

  private sortValue(row: SubstitutePaymentRow, column: string): TableSortValue {
    switch (column) {
      case 'playerName': return row.playerName
      case 'trainingDate': return row.trainingDate
      case 'amount': return row.amount
      default: return Number(row.paid)
    }
  }

  async createPayment(): Promise<void> {
    if (this.isAdmin() !== true || this.creating) return
    const { playerId, trainingId, amount } = this.form.getRawValue()
    if (!this.players.some(player => player.id === playerId)
      || !this.trainings.some(training => training.id === trainingId)) {
      this.snackBar.open('Choose a player and training.', 'Close', { duration: 3000 })
      return
    }
    if (amount === null || !Number.isFinite(amount) || amount <= 0
      || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-8) {
      this.snackBar.open('Enter a positive amount in euros and cents.', 'Close', { duration: 3000 })
      return
    }
    if (this.rows.some(row => row.playerId === playerId && row.trainingId === trainingId)) {
      this.snackBar.open('This player already has a payment for that training.', 'Close', { duration: 4000 })
      return
    }

    this.creating = true
    try {
      await this.paymentService.create(playerId, trainingId, amount)
    } catch (error) {
      console.error('Could not add substitute payment', error)
      this.snackBar.open('Could not add substitute payment.', 'Close', { duration: 5000 })
      this.creating = false
      return
    }

    this.form.reset({ playerId: '', trainingId: '', amount: 5 })
    this.snackBar.open('Substitute payment added.', 'Close', { duration: 3000 })
    try {
      await this.reloadData()
    } finally {
      this.creating = false
    }
  }

  async togglePaid(row: SubstitutePaymentRow, event: MatSlideToggleChange): Promise<void> {
    if (this.isAdmin() !== true || this.savingPaymentId || this.deletingPaymentId) {
      event.source.checked = row.paid
      return
    }
    const previous = row.paid
    row.paid = event.checked
    this.savingPaymentId = row.firestoreId
    try {
      await this.paymentService.setPaid(row.firestoreId, row.paid)
    } catch (error) {
      console.error('Could not update substitute payment', error)
      row.paid = previous
      event.source.checked = previous
      this.snackBar.open('Could not update paid status.', 'Close', { duration: 5000 })
    } finally {
      this.savingPaymentId = null
      this.rows = sortTableRows(this.rows, this.sort, this.sortValue)
    }
  }

  async confirmDelete(row: SubstitutePaymentRow): Promise<void> {
    if (this.isAdmin() !== true || this.paymentToDelete || this.deletingPaymentId
      || this.savingPaymentId || !this.confirmDeleteDialog) return
    this.paymentToDelete = row
    const confirmed = await firstValueFrom(this.dialog.open(this.confirmDeleteDialog, {
      width: '440px',
      maxWidth: 'calc(100vw - 32px)',
      role: 'alertdialog',
    }).afterClosed())
    this.paymentToDelete = undefined
    if (confirmed !== true) return

    this.deletingPaymentId = row.firestoreId
    try {
      await this.paymentService.delete(row.firestoreId)
      this.rows = this.rows.filter(payment => payment.firestoreId !== row.firestoreId)
      this.snackBar.open('Substitute payment deleted.', 'Close', { duration: 3000 })
    } catch (error) {
      console.error('Could not delete substitute payment', error)
      this.snackBar.open('Could not delete substitute payment.', 'Close', { duration: 5000 })
    } finally {
      this.deletingPaymentId = null
    }
  }
}
