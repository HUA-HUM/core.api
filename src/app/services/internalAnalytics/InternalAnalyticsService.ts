import { Injectable } from '@nestjs/common';
import { env } from '../../../config/env';
import { GetInternalAnalyticsOverviewInteractor } from '../../../core/interactors/internalAnalytics/GetInternalAnalyticsOverviewInteractor';
import { InternalAnalyticsOverview } from '../../../core/entities/internalAnalytics/InternalAnalyticsOverview';

@Injectable()
export class InternalAnalyticsService {
  constructor(
    private readonly getInternalAnalyticsOverviewInteractor: GetInternalAnalyticsOverviewInteractor,
  ) {}

  async overview(): Promise<InternalAnalyticsOverview> {
    return this.getInternalAnalyticsOverviewInteractor.execute(
      env.analyticsTimeZone,
    );
  }
}
