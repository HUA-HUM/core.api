import { Module } from '@nestjs/common';
import {
  IInternalAnalyticsRepository,
  INTERNAL_ANALYTICS_REPOSITORY,
} from '../../../core/adapters/repositories/internalAnalytics/IInternalAnalyticsRepository';
import { GetInternalAnalyticsOverviewInteractor } from '../../../core/interactors/internalAnalytics/GetInternalAnalyticsOverviewInteractor';
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
    InternalAnalyticsGuard,
    InternalAnalyticsService,
  ],
})
export class InternalAnalyticsModule {}
