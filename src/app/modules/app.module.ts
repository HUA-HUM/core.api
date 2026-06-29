import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/DatabaseModule';
import { HealthModule } from './health.module';
import { RitualsModule } from './rituals/RitualsModule';
import { RitualSessionsModule } from './ritualSessions/RitualSessionsModule';
import { ModesModule } from './modes/ModesModule';
import { ModeSessionsModule } from './modeSessions/ModeSessionsModule';
import { NfcTagsModule } from './nfcTags/NfcTagsModule';
import { InternalAnalyticsModule } from './internalAnalytics/InternalAnalyticsModule';
import { FocusMetricsModule } from './focusMetrics/FocusMetricsModule';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    RitualsModule,
    RitualSessionsModule,
    ModesModule,
    ModeSessionsModule,
    NfcTagsModule,
    InternalAnalyticsModule,
    FocusMetricsModule,
  ],
})
export class AppModule {}
