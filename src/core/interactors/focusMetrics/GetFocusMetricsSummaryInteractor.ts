import { IFocusMetricsRepository } from '../../adapters/repositories/focusMetrics/IFocusMetricsRepository';
import { FocusMetricsSummary } from '../../entities/focusMetrics/FocusMetricsSummary';

export class GetFocusMetricsSummaryInteractor {
  constructor(private readonly focusMetricsRepository: IFocusMetricsRepository) {}

  async execute(userId: string): Promise<FocusMetricsSummary> {
    return this.focusMetricsRepository.getSummaryByUserId(userId);
  }
}
