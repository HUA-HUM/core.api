import { InternalAnalyticsOverview } from '../../../entities/internalAnalytics/InternalAnalyticsOverview';
import {
  InternalAnalyticsPeriod,
  InternalAnalyticsPeriodMetrics,
} from '../../../entities/internalAnalytics/InternalAnalyticsPeriodMetrics';
import { InternalAnalyticsRitualHistory } from '../../../entities/internalAnalytics/InternalAnalyticsRitualHistory';
import { InternalAnalyticsStreaks } from '../../../entities/internalAnalytics/InternalAnalyticsStreaks';

export const INTERNAL_ANALYTICS_REPOSITORY = Symbol(
  'INTERNAL_ANALYTICS_REPOSITORY',
);

export interface IInternalAnalyticsRepository {
  getOverview(timeZone: string): Promise<InternalAnalyticsOverview>;
  getRitualHistory(
    ritualId: string,
    limit: number,
  ): Promise<InternalAnalyticsRitualHistory | null>;
  getPeriodMetrics(
    timeZone: string,
    period: InternalAnalyticsPeriod,
    buckets: number,
  ): Promise<InternalAnalyticsPeriodMetrics>;
  getStreaks(
    timeZone: string,
    limit: number,
  ): Promise<InternalAnalyticsStreaks>;
}
