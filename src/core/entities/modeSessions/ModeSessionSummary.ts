export interface ModeSessionSummary {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  activeSessions: number;
  totalFocusSeconds: number;
  totalFocusMinutes: number;
  currentStreakDays: number;
  lastSessionAt: Date | null;
}
