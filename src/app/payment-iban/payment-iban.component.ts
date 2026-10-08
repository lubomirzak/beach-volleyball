import { CdkCopyToClipboard } from '@angular/cdk/clipboard'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBar } from '@angular/material/snack-bar'

@Component({
  selector: 'app-payment-iban',
  imports: [CdkCopyToClipboard, MatButtonModule, MatIconModule],
  template: `
    <section class="payment-note" aria-label="Bank transfer details">
      <span>Pay by bank transfer to this IBAN:</span>
      <button mat-stroked-button type="button" class="iban-button"
        [cdkCopyToClipboard]="iban" (cdkCopyToClipboardCopied)="onCopied($event)"
        aria-label="Copy IBAN SK73 1100 0000 0029 3414 6758">
        <span>SK73 1100 0000 0029 3414 6758</span>
        <mat-icon>content_copy</mat-icon>
      </button>
    </section>
  `,
  styles: `
    .payment-note {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 20px;
      padding: 16px 20px;
      margin: 12px 0 28px;
      border: 1px solid var(--mat-sys-primary);
      border-radius: 12px;
      background: var(--mat-sys-primary-container);
    }
    .iban-button.mat-mdc-outlined-button {
      color: var(--mat-sys-primary);
      border-color: var(--mat-sys-primary);
      white-space: normal;
      height: auto;
      min-height: 40px;
      padding: 8px 12px;
    }
    .iban-button span { overflow-wrap: anywhere; }
    .iban-button mat-icon { margin-left: 8px; }
  `,
})
export class PaymentIbanComponent {
  private readonly snackBar = inject(MatSnackBar)
  readonly iban = 'SK7311000000002934146758'

  onCopied(copied: boolean): void {
    this.snackBar.open(copied ? 'IBAN copied.' : 'Could not copy IBAN.', 'Close', {
      duration: 3000,
    })
  }
}
