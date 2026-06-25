import { IInternalAnalyticsRepository } from '../../adapters/repositories/internalAnalytics/IInternalAnalyticsRepository';
import {
  InternalAnalyticsPeriod,
  InternalAnalyticsPeriodMetrics,
} from '../../entities/internalAnalytics/InternalAnalyticsPeriodMetrics';

export class GetInternalAnalyticsPeriodMetricsInteractor {
  constructor(
    private readonly internalAnalyticsRepository: IInternalAnalyticsRepository,
  ) {}

  async execute(
    timeZone: string,
    period: InternalAnalyticsPeriod,
    buckets: number,
  ): Promise<InternalAnalyticsPeriodMetrics> {
    return this.internalAnalyticsRepository.getPeriodMetrics(
      timeZone,
      period,
      buckets,
    );
  }
}
