import { InternalAnalyticsOverview } from '../../../entities/internalAnalytics/InternalAnalyticsOverview';

export const INTERNAL_ANALYTICS_REPOSITORY = Symbol(
  'INTERNAL_ANALYTICS_REPOSITORY',
);

export interface IInternalAnalyticsRepository {
  getOverview(timeZone: string): Promise<InternalAnalyticsOverview>;
}
