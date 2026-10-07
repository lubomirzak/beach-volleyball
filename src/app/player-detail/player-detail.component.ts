import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { MatTableModule } from '@angular/material/table'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { ChartData, ChartOptions } from 'chart.js'
import { BaseChartDirective } from 'ng2-charts'
import { Player } from 'src/interfaces/player'
import { Match } from 'src/interfaces/match'
import { Training } from 'src/interfaces/training'
import { HISTORY_SEASONS } from '../history/seasons'
import { MatchService } from '../match.service'
import { PlayerService } from '../player.service'
import { TrainingService } from '../training.service'

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

interface TrainingSummary extends MatchTotals {
  id: string
  partnerIds: Set<string>
  recordedAt: number | null
}

interface TrainingPoint {
  label: string
  tooltipDate: string
  dateEstimated: boolean
  trainingMatches: number
  trainingWins: number
  cumulativeMatches: number
  cumulativeWins: number
  ratio: number
  partners: string[]
}

interface SeasonTrend {
  slug: string
  label: string
  points: TrainingPoint[]
}

@Component({
  selector: 'app-player-detail',
  imports: [BaseChartDirective, MatButtonModule, MatFormFieldModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule, MatTableModule, RouterModule],
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

      <section class="table-section" aria-labelledby="ratio-chart-title">
        <div class="chart-heading">
          <h2 id="ratio-chart-title">Ratio over trainings</h2>
          <mat-form-field appearance="outline" class="season-picker">
            <mat-label>Season</mat-label>
            <mat-select [value]="selectedChartSeason" (selectionChange)="selectChartSeason($event.value)">
              @for (season of seasonTrends; track season.slug) {
                <mat-option [value]="season.slug">{{ season.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        @if (chartPoints.length === 0) {
          <p>No matches for this player in this season.</p>
        } @else {
          <div class="chart-container">
            <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'line'"
              role="img" [attr.aria-label]="'Running match win ratio over trainings in ' + selectedChartSeasonLabel"></canvas>
          </div>
          <p class="chart-note">Each point includes all matches played up to that training. Hover or tap a point for that training's results and partners.</p>
          @if (hasEstimatedDates) {
            <p class="chart-note">Some training dates were unavailable, so their match entry dates are shown instead.</p>
          }
        }
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

    .chart-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px 24px;
    }

    .chart-heading h2 {
      margin: 0 0 16px;
    }

    .season-picker {
      width: 200px;
    }

    .chart-container {
      position: relative;
      height: 320px;
      width: 100%;
    }

    .chart-note {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.875rem;
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
  seasonTrends: SeasonTrend[] = []
  selectedChartSeason = ''
  selectedChartSeasonLabel = ''
  chartPoints: TrainingPoint[] = []
  hasEstimatedDates = false
  chartData: ChartData<'line', number[], string> = { labels: [], datasets: [] }
  readonly chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { title: { display: true, text: 'Training' }, ticks: { autoSkip: true, maxTicksLimit: 8, maxRotation: 0 } },
      y: { min: 0, max: 1, title: { display: true, text: 'Ratio' }, ticks: { stepSize: 0.2 } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: items => this.chartPoints[items[0]?.dataIndex]?.tooltipDate ?? '',
          label: item => {
            const point = this.chartPoints[item.dataIndex]
            return point ? `Running ratio: ${point.ratio.toFixed(2)} (${point.cumulativeWins}/${point.cumulativeMatches})` : ''
          },
          afterLabel: item => {
            const point = this.chartPoints[item.dataIndex]
            if (!point) return []
            return [
              `This training: ${point.trainingWins} wins / ${point.trainingMatches} matches`,
              ...point.partners.map(partner => `Partner: ${partner}`),
            ]
          },
        },
      },
    },
  }
  readonly seasonColumns = ['season', 'matches', 'wins', 'ratio']
  readonly partnerColumns = ['partner', 'matches', 'wins', 'ratio']

  constructor(
    private route: ActivatedRoute,
    private playerService: PlayerService,
    private matchService: MatchService,
    private trainingService: TrainingService
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
      const matchesBySeason = await Promise.all(HISTORY_SEASONS.map(season =>
        this.matchService.getAllMatches(season.matchesCollection)
      ))
      const trainingsBySeason = await Promise.all(HISTORY_SEASONS.map(async (season, index) => {
        if (!matchesBySeason[index].some(match => this.partnerInMatch(match, playerId))) return [] as Training[]
        try {
          return await this.trainingService.get(season.trainingsCollection)
        } catch (error) {
          console.warn(`Could not load training dates for ${season.label}`, error)
          return [] as Training[]
        }
      }))

      const seasonRows: SeasonRatio[] = []
      const partnerSeasons: PartnerSeason[] = []
      const seasonTrends: SeasonTrend[] = []
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
        seasonTrends.push({
          slug: season.slug,
          label: season.label,
          points: this.buildTrainingPoints(matchesBySeason[index], trainingsBySeason[index], playerId, playersById),
        })
      })

      this.seasonRows = seasonRows
      this.partnerSeasons = partnerSeasons
      this.seasonTrends = seasonTrends
      this.selectChartSeason(seasonTrends.find(season => season.points.length > 0)?.slug ?? seasonTrends[0]?.slug ?? '')
    } catch (error) {
      console.error('Could not load player details', error)
      this.error = 'Could not load player details.'
    } finally {
      this.loading = false
    }
  }

  selectChartSeason(slug: string): void {
    const season = this.seasonTrends.find(item => item.slug === slug)
    this.selectedChartSeason = slug
    this.selectedChartSeasonLabel = season?.label ?? ''
    this.chartPoints = season?.points ?? []
    this.hasEstimatedDates = this.chartPoints.some(point => point.dateEstimated)
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--mat-sys-primary').trim() || '#006a6a'
    this.chartData = {
      labels: this.chartPoints.map(point => point.label),
      datasets: [{
        label: 'Running ratio',
        data: this.chartPoints.map(point => point.ratio),
        borderColor: primaryColor,
        backgroundColor: primaryColor,
        pointRadius: 4,
        pointHoverRadius: 7,
        borderWidth: 2,
        tension: 0,
      }],
    }
  }

  private buildTrainingPoints(
    matches: Match[],
    trainings: Training[],
    playerId: string,
    playersById: Map<string, Player>
  ): TrainingPoint[] {
    const trainingDates = new Map(trainings.map(training => [training.id, training.date] as const))
    const summaries = new Map<string, TrainingSummary>()
    for (const match of matches) {
      const partnerId = this.partnerInMatch(match, playerId)
      if (!partnerId) continue
      const id = match.trainingId && match.trainingId !== 'UNKNOWN' ? match.trainingId : match.id
      const summary = summaries.get(id) ?? { id, matches: 0, wins: 0, partnerIds: new Set<string>(), recordedAt: null }
      summary.matches++
      if (this.wonMatch(match, playerId)) summary.wins++
      summary.partnerIds.add(partnerId)
      if (Number.isFinite(match.created) && match.created > 0) {
        summary.recordedAt = summary.recordedAt === null ? match.created : Math.min(summary.recordedAt, match.created)
      }
      summaries.set(id, summary)
    }

    const dated = Array.from(summaries.values(), summary => {
      const actualDate = trainingDates.get(summary.id)
      const hasTrainingDate = actualDate instanceof Date && !Number.isNaN(actualDate.getTime())
      const recordedDate = summary.recordedAt === null ? null : new Date(summary.recordedAt)
      const date = hasTrainingDate ? actualDate : recordedDate && !Number.isNaN(recordedDate.getTime()) ? recordedDate : null
      return { summary, date, dateEstimated: !hasTrainingDate }
    }).sort((a, b) =>
      (a.date?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.date?.getTime() ?? Number.MAX_SAFE_INTEGER)
      || a.summary.id.localeCompare(b.summary.id)
    )

    let cumulativeMatches = 0
    let cumulativeWins = 0
    return dated.map(({ summary, date, dateEstimated }, index) => {
      cumulativeMatches += summary.matches
      cumulativeWins += summary.wins
      const dateLabel = date?.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      return {
        label: dateLabel ?? `Training ${index + 1}`,
        tooltipDate: dateLabel ? `${dateEstimated ? 'Match recorded' : 'Training'}: ${dateLabel}` : `Training ${index + 1}: date unavailable`,
        dateEstimated,
        trainingMatches: summary.matches,
        trainingWins: summary.wins,
        cumulativeMatches,
        cumulativeWins,
        ratio: cumulativeWins / cumulativeMatches,
        partners: Array.from(summary.partnerIds, id => this.partnerName(playersById, id)).sort((a, b) => a.localeCompare(b)),
      }
    })
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
