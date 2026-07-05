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
import { FocusSessionsModule } from './focusSessions/FocusSessionsModule';
import { LandingWaitlistLeadsModule } from './landingWaitlistLeads/LandingWaitlistLeadsModule';
import { IdempotencyModule } from './idempotency/IdempotencyModule';

@Module({
  imports: [
    DatabaseModule,
    IdempotencyModule,
    HealthModule,
    RitualsModule,
    RitualSessionsModule,
    ModesModule,
    ModeSessionsModule,
    NfcTagsModule,
    InternalAnalyticsModule,
    FocusMetricsModule,
    FocusSessionsModule,
    LandingWaitlistLeadsModule,
  ],
})
export class AppModule {}
