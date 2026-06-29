import { BadRequestException, Injectable } from '@nestjs/common';
import { FocusMetricsSummary } from '../../../core/entities/focusMetrics/FocusMetricsSummary';
import { GetFocusMetricsSummaryInteractor } from '../../../core/interactors/focusMetrics/GetFocusMetricsSummaryInteractor';

@Injectable()
export class FocusMetricsService {
  constructor(
    private readonly getFocusMetricsSummaryInteractor: GetFocusMetricsSummaryInteractor,
  ) {}

  async summary(userId: string): Promise<FocusMetricsSummary> {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }

    return this.getFocusMetricsSummaryInteractor.execute(userId);
  }
}
