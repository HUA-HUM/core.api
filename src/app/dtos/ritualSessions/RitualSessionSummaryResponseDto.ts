import { RitualSessionSummary } from '../../../core/entities/ritualSessions/RitualSessionSummary';

export class RitualSessionSummaryResponseDto {
  totalSessions!: number;
  completedSessions!: number;
  cancelledSessions!: number;
  activeSessions!: number;
  totalFocusSeconds!: number;
  totalFocusMinutes!: number;
  currentStreakDays!: number;
  lastSessionAt!: string | null;

  static fromEntity(summary: RitualSessionSummary): RitualSessionSummaryResponseDto {
    return {
      totalSessions: summary.totalSessions,
      completedSessions: summary.completedSessions,
      cancelledSessions: summary.cancelledSessions,
      activeSessions: summary.activeSessions,
      totalFocusSeconds: summary.totalFocusSeconds,
      totalFocusMinutes: summary.totalFocusMinutes,
      currentStreakDays: summary.currentStreakDays,
      lastSessionAt: summary.lastSessionAt?.toISOString() ?? null,
    };
  }
}
