import { Module } from '@nestjs/common';
import {
  FOCUS_METRICS_REPOSITORY,
  IFocusMetricsRepository,
} from '../../../core/adapters/repositories/focusMetrics/IFocusMetricsRepository';
import { GetFocusMetricsSummaryInteractor } from '../../../core/interactors/focusMetrics/GetFocusMetricsSummaryInteractor';
import { FocusMetricsController } from '../../controllers/focusMetrics/FocusMetricsController';
import { FocusMetricsService } from '../../services/focusMetrics/FocusMetricsService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

@Module({
  imports: [JwtAuthModule],
  controllers: [FocusMetricsController],
  providers: [
    {
      provide: GetFocusMetricsSummaryInteractor,
      useFactory: (focusMetricsRepository: IFocusMetricsRepository) =>
        new GetFocusMetricsSummaryInteractor(focusMetricsRepository),
      inject: [FOCUS_METRICS_REPOSITORY],
    },
    FocusMetricsService,
  ],
})
export class FocusMetricsModule {}
