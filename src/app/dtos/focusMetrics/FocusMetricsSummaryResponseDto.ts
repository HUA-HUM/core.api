import { FocusMetricsSummary } from '../../../core/entities/focusMetrics/FocusMetricsSummary';

export class FocusMetricsSummaryResponseDto {
  totalSessions!: number;
  completedSessions!: number;
  cancelledSessions!: number;
  activeSessions!: number;
  ritualSessions!: number;
  modeSessions!: number;
  totalFocusSeconds!: number;
  totalFocusMinutes!: number;
  focusDays!: number;
  currentStreakDays!: number;
  lastSessionAt!: string | null;
  weeklyFocus!: FocusMetricsSummary['weeklyFocus'];

  static fromEntity(
    summary: FocusMetricsSummary,
  ): FocusMetricsSummaryResponseDto {
    return {
      ...summary,
      lastSessionAt: summary.lastSessionAt?.toISOString() ?? null,
    };
  }
}
