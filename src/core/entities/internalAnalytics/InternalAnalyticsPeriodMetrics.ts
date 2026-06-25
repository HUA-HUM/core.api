export type InternalAnalyticsPeriod = 'week' | 'month';

export interface InternalAnalyticsPeriodBucket {
  periodStart: Date;
  periodEnd: Date;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  activeSessions: number;
  totalFocusMinutes: number;
  averageFocusMinutes: number;
  activeUsers: number;
  activeRituals: number;
}

export interface InternalAnalyticsPeriodMetrics {
  generatedAt: Date;
  period: InternalAnalyticsPeriod;
  buckets: InternalAnalyticsPeriodBucket[];
}
