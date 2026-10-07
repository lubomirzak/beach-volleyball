import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatTableModule } from '@angular/material/table'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Player } from 'src/interfaces/player'
import { Match } from 'src/interfaces/match'
import { HISTORY_SEASONS } from '../history/seasons'
import { MatchService } from '../match.service'
import { PlayerService } from '../player.service'

interface SeasonRatio {
  season: string
  matches: number
  wins: number
  ratio: string
}

interface PartnerRatio {
  partner: string
  matches: number
  wins: number
  ratio: string
}

interface PartnerSeason {
  label: string
  rows: PartnerRatio[]
}

interface MatchTotals {
  matches: number
  wins: number
}

@Component({
  selector: 'app-player-detail',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, RouterModule],
  template: `
    <header class="page-heading">
      <h1>{{ playerName || 'Player details' }}</h1>
      <a mat-stroked-button class="back-to-players" [routerLink]="['/players']">
        <mat-icon>arrow_back</mat-icon>
        All players
      </a>
    </header>

    @if (loading) {
      <mat-spinner></mat-spinner>
    } @else if (error) {
      <p role="alert">{{ error }}</p>
    } @else {
      <p class="ratio-note">Ratio is wins divided by matches played.</p>

      <section class="table-section">
        <h2>By season</h2>
        <div class="table-scroll">
          <table mat-table [dataSource]="seasonRows">
            <ng-container matColumnDef="season">
              <th mat-header-cell *matHeaderCellDef>Season</th>
              <td mat-cell *matCellDef="let row">{{ row.season }}</td>
            </ng-container>
            <ng-container matColumnDef="matches">
              <th mat-header-cell *matHeaderCellDef>Matches played</th>
              <td mat-cell *matCellDef="let row">{{ row.matches }}</td>
            </ng-container>
            <ng-container matColumnDef="wins">
              <th mat-header-cell *matHeaderCellDef>Wins</th>
              <td mat-cell *matCellDef="let row">{{ row.wins }}</td>
            </ng-container>
            <ng-container matColumnDef="ratio">
              <th mat-header-cell *matHeaderCellDef>Ratio</th>
              <td mat-cell *matCellDef="let row">{{ row.ratio }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="seasonColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: seasonColumns"></tr>
          </table>
        </div>
      </section>

      <section class="table-section">
        <h2>With partners</h2>
        @for (season of partnerSeasons; track season.label) {
          <div class="partner-season">
            <h3>{{ season.label }}</h3>
            @if (season.rows.length === 0) {
              <p>No partner matches this season.</p>
            } @else {
              <div class="table-scroll">
                <table mat-table class="partner-table" [dataSource]="season.rows">
                  <ng-container matColumnDef="partner">
                    <th mat-header-cell *matHeaderCellDef>Partner</th>
                    <td mat-cell *matCellDef="let row">{{ row.partner }}</td>
                  </ng-container>
                  <ng-container matColumnDef="matches">
                    <th mat-header-cell *matHeaderCellDef>Matches played</th>
                    <td mat-cell *matCellDef="let row">{{ row.matches }}</td>
                  </ng-container>
                  <ng-container matColumnDef="wins">
                    <th mat-header-cell *matHeaderCellDef>Wins</th>
                    <td mat-cell *matCellDef="let row">{{ row.wins }}</td>
                  </ng-container>
                  <ng-container matColumnDef="ratio">
                    <th mat-header-cell *matHeaderCellDef>Ratio</th>
                    <td mat-cell *matCellDef="let row">{{ row.ratio }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="partnerColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: partnerColumns"></tr>
                </table>
              </div>
            }
          </div>
        }
      </section>
    }
  `,
  styles: `
    .page-heading {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px 24px;
      margin: 8px 0 24px;
    }

    .page-heading h1 {
      margin: 0;
    }

    .back-to-players.mat-mdc-outlined-button {
      margin-left: auto;
      color: var(--mat-sys-primary);
      border-color: var(--mat-sys-primary);
      background-color: var(--mat-sys-primary-container);
    }

    .ratio-note {
      color: var(--mat-sys-on-surface-variant);
    }

    .table-section {
      margin-top: 28px;
    }

    .table-scroll {
      overflow-x: auto;
    }

    .partner-season {
      margin-top: 24px;
    }

    table {
      width: 100%;
    }

    .partner-table {
      min-width: 620px;
      table-layout: fixed;
    }

    .partner-table .mat-column-partner { width: 45%; }
    .partner-table .mat-column-matches { width: 25%; }
    .partner-table .mat-column-wins { width: 15%; }
    .partner-table .mat-column-ratio { width: 15%; }
  `,
})
export class PlayerDetailComponent {
  playerName = ''
  loading = true
  error = ''
  seasonRows: SeasonRatio[] = []
  partnerSeasons: PartnerSeason[] = []
  readonly seasonColumns = ['season', 'matches', 'wins', 'ratio']
  readonly partnerColumns = ['partner', 'matches', 'wins', 'ratio']

  constructor(
    private route: ActivatedRoute,
    private playerService: PlayerService,
    private matchService: MatchService
  ) {
    void this.loadPlayer(this.route.snapshot.paramMap.get('id'))
  }

  private async loadPlayer(playerId: string | null): Promise<void> {
    if (!playerId) {
      this.error = 'Player not found.'
      this.loading = false
      return
    }

    try {
      const players = await this.playerService.get()
      const player = players.find(item => item.id === playerId)
      if (!player) {
        this.error = 'Player not found.'
        return
      }

      this.playerName = this.formatName(player)
      const playersById = new Map(players.map(item => [item.id, item] as const))
      const matchesBySeason = await Promise.all(
        HISTORY_SEASONS.map(season => this.matchService.getAllMatches(season.matchesCollection))
      )

      const seasonRows: SeasonRatio[] = []
      const partnerSeasons: PartnerSeason[] = []
      HISTORY_SEASONS.forEach((season, index) => {
        const totals: MatchTotals = { matches: 0, wins: 0 }
        const partners = new Map<string, MatchTotals>()

        for (const match of matchesBySeason[index]) {
          const partnerId = this.partnerInMatch(match, playerId)
          if (!partnerId) continue

          const won = this.wonMatch(match, playerId)
          totals.matches++
          if (won) totals.wins++

          const partnerTotals = partners.get(partnerId) ?? { matches: 0, wins: 0 }
          partnerTotals.matches++
          if (won) partnerTotals.wins++
          partners.set(partnerId, partnerTotals)
        }

        seasonRows.push({
          season: season.label,
          ...totals,
          ratio: this.ratio(totals),
        })

        const rows = Array.from(partners, ([partnerId, partnerTotals]) => ({
          partner: this.partnerName(playersById, partnerId),
          ...partnerTotals,
          ratio: this.ratio(partnerTotals),
        }))
        rows.sort((a, b) =>
          Number(b.ratio) - Number(a.ratio) || a.partner.localeCompare(b.partner)
        )
        partnerSeasons.push({ label: season.label, rows })
      })

      this.seasonRows = seasonRows
      this.partnerSeasons = partnerSeasons
    } catch (error) {
      console.error('Could not load player details', error)
      this.error = 'Could not load player details.'
    } finally {
      this.loading = false
    }
  }

  private partnerInMatch(match: Match, playerId: string): string | null {
    if (match.team1Player1 === playerId) return match.team1Player2
    if (match.team1Player2 === playerId) return match.team1Player1
    if (match.team2Player1 === playerId) return match.team2Player2
    if (match.team2Player2 === playerId) return match.team2Player1
    return null
  }

  private wonMatch(match: Match, playerId: string): boolean {
    const onTeam1 = match.team1Player1 === playerId || match.team1Player2 === playerId
    return onTeam1 ? match.team1Points > match.team2Points : match.team2Points > match.team1Points
  }

  private partnerName(playersById: Map<string, Player>, partnerId: string): string {
    const partner = playersById.get(partnerId)
    return partner ? this.formatName(partner) : `Unknown player (${partnerId})`
  }

  private formatName(player: Player): string {
    return `${player.lastName.toLocaleUpperCase()} ${player.firstName}`
  }

  private ratio(totals: MatchTotals): string {
    return totals.matches === 0 ? '—' : (totals.wins / totals.matches).toFixed(2)
  }
}
