import { ModeSessionSummary } from '../../../core/entities/modeSessions/ModeSessionSummary';

export class ModeSessionSummaryResponseDto {
  totalSessions!: number;
  completedSessions!: number;
  cancelledSessions!: number;
  activeSessions!: number;
  totalFocusSeconds!: number;
  totalFocusMinutes!: number;
  currentStreakDays!: number;
  lastSessionAt!: string | null;

  static fromEntity(
    summary: ModeSessionSummary,
  ): ModeSessionSummaryResponseDto {
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
