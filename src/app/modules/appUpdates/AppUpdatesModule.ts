import { Module } from '@nestjs/common';
import { AppUpdatesController } from '../../controllers/appUpdates/AppUpdatesController';
import { AppUpdatesService } from '../../services/appUpdates/AppUpdatesService';
import { InitialAppUpdatesService } from '../../services/appUpdates/InitialAppUpdatesService';
import { InternalAnalyticsGuard } from '../../services/internalAnalytics/guards/InternalAnalyticsGuard';

@Module({
  controllers: [AppUpdatesController],
  providers: [
    AppUpdatesService,
    InitialAppUpdatesService,
    InternalAnalyticsGuard,
  ],
})
export class AppUpdatesModule {}
