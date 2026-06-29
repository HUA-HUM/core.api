import { FocusMetricsSummary } from '../../../entities/focusMetrics/FocusMetricsSummary';

export const FOCUS_METRICS_REPOSITORY = Symbol('FOCUS_METRICS_REPOSITORY');

export interface IFocusMetricsRepository {
  getSummaryByUserId(userId: string): Promise<FocusMetricsSummary>;
}
