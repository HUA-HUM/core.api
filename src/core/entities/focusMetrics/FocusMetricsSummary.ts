export interface FocusMetricDay {
  date: string;
  totalFocusSeconds: number;
  totalFocusMinutes: number;
}

export interface FocusMetricsSummary {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  activeSessions: number;
  ritualSessions: number;
  modeSessions: number;
  totalFocusSeconds: number;
  totalFocusMinutes: number;
  focusDays: number;
  currentStreakDays: number;
  lastSessionAt: Date | null;
  weeklyFocus: FocusMetricDay[];
}
