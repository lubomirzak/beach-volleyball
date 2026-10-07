import { Component } from '@angular/core'
import { MatTableModule } from '@angular/material/table'
import { RouterModule } from '@angular/router'
import { HISTORY_SEASONS } from './seasons'

@Component({
  selector: 'app-history',
  imports: [MatTableModule, RouterModule],
  template: `
    <h1>History</h1>
    <table mat-table [dataSource]="seasons">
      <ng-container matColumnDef="season">
        <th mat-header-cell *matHeaderCellDef>Season</th>
        <td mat-cell *matCellDef="let season" style="padding: 0">
          <a class="season-link" [routerLink]="['/history', season.slug]">
            {{ season.label }}{{ season.current ? ' (current)' : '' }}
          </a>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="columnNames"></tr>
      <tr mat-row *matRowDef="let row; columns: columnNames"></tr>
    </table>
  `,
  styles: `
    .season-link {
      display: block;
      box-sizing: border-box;
      width: 100%;
      padding: 16px;
      color: var(--mat-sys-primary);
      text-decoration: none;
    }
    .season-link:hover {
      text-decoration: underline;
    }
  `,
})
export class HistoryComponent {
  readonly seasons = HISTORY_SEASONS
  readonly columnNames = ['season']
}
