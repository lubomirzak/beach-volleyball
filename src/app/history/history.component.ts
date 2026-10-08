import { Component } from '@angular/core'
import { MatTableModule } from '@angular/material/table'
import { MatSortModule, Sort } from '@angular/material/sort'
import { sortTableRows } from '../table-sort'
import { RouterModule } from '@angular/router'
import { HISTORY_SEASONS } from './seasons'

@Component({
  selector: 'app-history',
  imports: [MatSortModule, MatTableModule, RouterModule],
  template: `
    <h1>History</h1>
    <table mat-table matSort [matSortDisableClear]="true" (matSortChange)="sortSeasons($event)" [dataSource]="seasons">
      <ng-container matColumnDef="season">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Season</th>
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
  seasons = [...HISTORY_SEASONS]

  sortSeasons(sort: Sort): void {
    this.seasons = sortTableRows(this.seasons, sort, season =>
      -HISTORY_SEASONS.findIndex(item => item.slug === season.slug))
  }
  readonly columnNames = ['season']
}
