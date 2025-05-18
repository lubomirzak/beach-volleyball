import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatTableModule } from '@angular/material/table'
import { TrainingService } from '../training.service'

@Component({
  selector: 'app-home',
  imports: [CommonModule, MatTableModule],
  template: `
    <h1 style="padding-top: 30px">Leaderboards</h1>

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
  `,
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  scoreboards$: any[] = []
  scoreboardColumnNames: any[] = ['name', 'sets', 'points', 'ratio']
  constructor(private trainingService: TrainingService) {
    this.reloadData()
  }

  reloadData = () => {
    this.trainingService.getLeaderboard().then((data) => {
      this.scoreboards$ = data
    })
  }
}
