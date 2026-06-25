export interface InternalAnalyticsUserStreak {
  userId: string;
  email: string | null;
  displayName: string | null;
  currentStreakDays: number;
  lastFocusDay: string;
  totalSessions: number;
  completedSessions: number;
  totalFocusMinutes: number;
}

export interface InternalAnalyticsStreaks {
  generatedAt: Date;
  users: InternalAnalyticsUserStreak[];
}
