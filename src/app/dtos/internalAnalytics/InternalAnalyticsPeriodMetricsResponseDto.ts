import { InternalAnalyticsPeriodMetrics } from '../../../core/entities/internalAnalytics/InternalAnalyticsPeriodMetrics';

export class InternalAnalyticsPeriodBucketResponseDto {
  periodStart!: string;
  periodEnd!: string;
  totalSessions!: number;
  completedSessions!: number;
  cancelledSessions!: number;
  activeSessions!: number;
  totalFocusMinutes!: number;
  averageFocusMinutes!: number;
  activeUsers!: number;
  activeRituals!: number;
}

export class InternalAnalyticsPeriodMetricsResponseDto {
  generatedAt!: string;
  period!: string;
  buckets!: InternalAnalyticsPeriodBucketResponseDto[];

  static fromEntity(
    metrics: InternalAnalyticsPeriodMetrics,
  ): InternalAnalyticsPeriodMetricsResponseDto {
    return {
      generatedAt: metrics.generatedAt.toISOString(),
      period: metrics.period,
      buckets: metrics.buckets.map((bucket) => ({
        ...bucket,
        periodStart: bucket.periodStart.toISOString(),
        periodEnd: bucket.periodEnd.toISOString(),
      })),
    };
  }
}
