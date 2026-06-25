import { Module } from '@nestjs/common';
import {
  IInternalAnalyticsRepository,
  INTERNAL_ANALYTICS_REPOSITORY,
} from '../../../core/adapters/repositories/internalAnalytics/IInternalAnalyticsRepository';
import { GetInternalAnalyticsOverviewInteractor } from '../../../core/interactors/internalAnalytics/GetInternalAnalyticsOverviewInteractor';
import { GetInternalAnalyticsPeriodMetricsInteractor } from '../../../core/interactors/internalAnalytics/GetInternalAnalyticsPeriodMetricsInteractor';
import { GetInternalAnalyticsRitualHistoryInteractor } from '../../../core/interactors/internalAnalytics/GetInternalAnalyticsRitualHistoryInteractor';
import { GetInternalAnalyticsStreaksInteractor } from '../../../core/interactors/internalAnalytics/GetInternalAnalyticsStreaksInteractor';
import { InternalAnalyticsController } from '../../controllers/internalAnalytics/InternalAnalyticsController';
import { InternalAnalyticsGuard } from '../../services/internalAnalytics/guards/InternalAnalyticsGuard';
import { InternalAnalyticsService } from '../../services/internalAnalytics/InternalAnalyticsService';

@Module({
  controllers: [InternalAnalyticsController],
  providers: [
    {
      provide: GetInternalAnalyticsOverviewInteractor,
      useFactory: (repository: IInternalAnalyticsRepository) =>
        new GetInternalAnalyticsOverviewInteractor(repository),
      inject: [INTERNAL_ANALYTICS_REPOSITORY],
    },
    {
      provide: GetInternalAnalyticsRitualHistoryInteractor,
      useFactory: (repository: IInternalAnalyticsRepository) =>
        new GetInternalAnalyticsRitualHistoryInteractor(repository),
      inject: [INTERNAL_ANALYTICS_REPOSITORY],
    },
    {
      provide: GetInternalAnalyticsPeriodMetricsInteractor,
      useFactory: (repository: IInternalAnalyticsRepository) =>
        new GetInternalAnalyticsPeriodMetricsInteractor(repository),
      inject: [INTERNAL_ANALYTICS_REPOSITORY],
    },
    {
      provide: GetInternalAnalyticsStreaksInteractor,
      useFactory: (repository: IInternalAnalyticsRepository) =>
        new GetInternalAnalyticsStreaksInteractor(repository),
      inject: [INTERNAL_ANALYTICS_REPOSITORY],
    },
    InternalAnalyticsGuard,
    InternalAnalyticsService,
  ],
})
export class InternalAnalyticsModule {}
