import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { env } from '../../../config/env';
import { GetInternalAnalyticsOverviewInteractor } from '../../../core/interactors/internalAnalytics/GetInternalAnalyticsOverviewInteractor';
import { InternalAnalyticsOverview } from '../../../core/entities/internalAnalytics/InternalAnalyticsOverview';
import {
  InternalAnalyticsPeriod,
  InternalAnalyticsPeriodMetrics,
} from '../../../core/entities/internalAnalytics/InternalAnalyticsPeriodMetrics';
import { InternalAnalyticsRitualHistory } from '../../../core/entities/internalAnalytics/InternalAnalyticsRitualHistory';
import { InternalAnalyticsStreaks } from '../../../core/entities/internalAnalytics/InternalAnalyticsStreaks';
import { GetInternalAnalyticsPeriodMetricsInteractor } from '../../../core/interactors/internalAnalytics/GetInternalAnalyticsPeriodMetricsInteractor';
import { GetInternalAnalyticsRitualHistoryInteractor } from '../../../core/interactors/internalAnalytics/GetInternalAnalyticsRitualHistoryInteractor';
import { GetInternalAnalyticsStreaksInteractor } from '../../../core/interactors/internalAnalytics/GetInternalAnalyticsStreaksInteractor';

@Injectable()
export class InternalAnalyticsService {
  constructor(
    private readonly getInternalAnalyticsOverviewInteractor: GetInternalAnalyticsOverviewInteractor,
    private readonly getInternalAnalyticsRitualHistoryInteractor: GetInternalAnalyticsRitualHistoryInteractor,
    private readonly getInternalAnalyticsPeriodMetricsInteractor: GetInternalAnalyticsPeriodMetricsInteractor,
    private readonly getInternalAnalyticsStreaksInteractor: GetInternalAnalyticsStreaksInteractor,
  ) {}

  async overview(): Promise<InternalAnalyticsOverview> {
    return this.getInternalAnalyticsOverviewInteractor.execute(
      env.analyticsTimeZone,
    );
  }

  async ritualHistory(
    ritualId: string,
    limitInput?: string,
  ): Promise<InternalAnalyticsRitualHistory> {
    this.validateRequiredText(ritualId, 'ritualId');

    const history =
      await this.getInternalAnalyticsRitualHistoryInteractor.execute(
        ritualId,
        this.parseLimit(limitInput, 100, 500),
      );

    if (!history) {
      throw new NotFoundException('ritual not found');
    }

    return history;
  }

  async periodMetrics(
    periodInput: string,
    bucketsInput?: string,
  ): Promise<InternalAnalyticsPeriodMetrics> {
    const period = this.parsePeriod(periodInput);
    return this.getInternalAnalyticsPeriodMetricsInteractor.execute(
      env.analyticsTimeZone,
      period,
      this.parseLimit(bucketsInput, period === 'week' ? 8 : 12, 36),
    );
  }

  async streaks(limitInput?: string): Promise<InternalAnalyticsStreaks> {
    return this.getInternalAnalyticsStreaksInteractor.execute(
      env.analyticsTimeZone,
      this.parseLimit(limitInput, 20, 100),
    );
  }

  private validateRequiredText(value: string, fieldName: string): void {
    if (!value?.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }

  private parsePeriod(value: string): InternalAnalyticsPeriod {
    if (value === 'week' || value === 'month') {
      return value;
    }

    throw new BadRequestException('period must be week or month');
  }

  private parseLimit(
    value: string | undefined,
    defaultValue: number,
    max: number,
  ): number {
    if (!value) {
      return defaultValue;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }

    return Math.min(parsed, max);
  }
}
