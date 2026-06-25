import { InternalAnalyticsStreaks } from '../../../core/entities/internalAnalytics/InternalAnalyticsStreaks';

export class InternalAnalyticsUserStreakResponseDto {
  userId!: string;
  email!: string | null;
  displayName!: string | null;
  currentStreakDays!: number;
  lastFocusDay!: string;
  totalSessions!: number;
  completedSessions!: number;
  totalFocusMinutes!: number;
}

export class InternalAnalyticsStreaksResponseDto {
  generatedAt!: string;
  users!: InternalAnalyticsUserStreakResponseDto[];

  static fromEntity(
    streaks: InternalAnalyticsStreaks,
  ): InternalAnalyticsStreaksResponseDto {
    return {
      generatedAt: streaks.generatedAt.toISOString(),
      users: streaks.users,
    };
  }
}
