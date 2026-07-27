import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { env } from '../../../config/env';
import { RITUALS_REPOSITORY } from '../../../core/adapters/repositories/rituals/IRitualsRepository';
import { RITUAL_BLOCKED_ITEMS_REPOSITORY } from '../../../core/adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import { RITUAL_SESSIONS_REPOSITORY } from '../../../core/adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { MODES_REPOSITORY } from '../../../core/adapters/repositories/modes/IModesRepository';
import { MODE_BLOCKED_ITEMS_REPOSITORY } from '../../../core/adapters/repositories/modeBlockedItems/IModeBlockedItemsRepository';
import { MODE_SESSIONS_REPOSITORY } from '../../../core/adapters/repositories/modeSessions/IModeSessionsRepository';
import { NFC_TAGS_REPOSITORY } from '../../../core/adapters/repositories/nfcTags/INfcTagsRepository';
import { INTERNAL_ANALYTICS_REPOSITORY } from '../../../core/adapters/repositories/internalAnalytics/IInternalAnalyticsRepository';
import { FOCUS_METRICS_REPOSITORY } from '../../../core/adapters/repositories/focusMetrics/IFocusMetricsRepository';
import { FOCUS_SESSIONS_REPOSITORY } from '../../../core/adapters/repositories/focusSessions/IFocusSessionsRepository';
import { LANDING_WAITLIST_LEADS_REPOSITORY } from '../../../core/adapters/repositories/landingWaitlistLeads/ILandingWaitlistLeadsRepository';
import { EMERGENCY_UNLOCKS_REPOSITORY } from '../../../core/adapters/repositories/emergencyUnlocks/IEmergencyUnlocksRepository';
import { LEGAL_DOCUMENTS_REPOSITORY } from '../../../core/adapters/repositories/legal/ILegalDocumentsRepository';
import { SQLRitualsRepository } from '../../drivers/repositories/rituals/SQLRitualsRepository';
import { SQLRitualBlockedItemsRepository } from '../../drivers/repositories/ritualBlockedItems/SQLRitualBlockedItemsRepository';
import { SQLRitualSessionsRepository } from '../../drivers/repositories/ritualSessions/SQLRitualSessionsRepository';
import { SQLModesRepository } from '../../drivers/repositories/modes/SQLModesRepository';
import { SQLModeBlockedItemsRepository } from '../../drivers/repositories/modeBlockedItems/SQLModeBlockedItemsRepository';
import { SQLModeSessionsRepository } from '../../drivers/repositories/modeSessions/SQLModeSessionsRepository';
import { SQLNfcTagsRepository } from '../../drivers/repositories/nfcTags/SQLNfcTagsRepository';
import { SQLInternalAnalyticsRepository } from '../../drivers/repositories/internalAnalytics/SQLInternalAnalyticsRepository';
import { SQLFocusMetricsRepository } from '../../drivers/repositories/focusMetrics/SQLFocusMetricsRepository';
import { SQLFocusSessionsRepository } from '../../drivers/repositories/focusSessions/SQLFocusSessionsRepository';
import { SQLLandingWaitlistLeadsRepository } from '../../drivers/repositories/landingWaitlistLeads/SQLLandingWaitlistLeadsRepository';
import { SQLEmergencyUnlocksRepository } from '../../drivers/repositories/emergencyUnlocks/SQLEmergencyUnlocksRepository';
import { SQLLegalDocumentsRepository } from '../../drivers/repositories/legal/SQLLegalDocumentsRepository';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: env.databaseUrl,
      synchronize: false,
      entities: [],
    }),
  ],
  providers: [
    {
      provide: RITUALS_REPOSITORY,
      useClass: SQLRitualsRepository,
    },
    {
      provide: RITUAL_BLOCKED_ITEMS_REPOSITORY,
      useClass: SQLRitualBlockedItemsRepository,
    },
    {
      provide: RITUAL_SESSIONS_REPOSITORY,
      useClass: SQLRitualSessionsRepository,
    },
    {
      provide: MODES_REPOSITORY,
      useClass: SQLModesRepository,
    },
    {
      provide: MODE_BLOCKED_ITEMS_REPOSITORY,
      useClass: SQLModeBlockedItemsRepository,
    },
    {
      provide: MODE_SESSIONS_REPOSITORY,
      useClass: SQLModeSessionsRepository,
    },
    {
      provide: NFC_TAGS_REPOSITORY,
      useClass: SQLNfcTagsRepository,
    },
    {
      provide: INTERNAL_ANALYTICS_REPOSITORY,
      useClass: SQLInternalAnalyticsRepository,
    },
    {
      provide: FOCUS_METRICS_REPOSITORY,
      useClass: SQLFocusMetricsRepository,
    },
    {
      provide: FOCUS_SESSIONS_REPOSITORY,
      useClass: SQLFocusSessionsRepository,
    },
    {
      provide: LANDING_WAITLIST_LEADS_REPOSITORY,
      useClass: SQLLandingWaitlistLeadsRepository,
    },
    {
      provide: EMERGENCY_UNLOCKS_REPOSITORY,
      useClass: SQLEmergencyUnlocksRepository,
    },
    {
      provide: LEGAL_DOCUMENTS_REPOSITORY,
      useClass: SQLLegalDocumentsRepository,
    },
  ],
  exports: [
    RITUALS_REPOSITORY,
    RITUAL_BLOCKED_ITEMS_REPOSITORY,
    RITUAL_SESSIONS_REPOSITORY,
    MODES_REPOSITORY,
    MODE_BLOCKED_ITEMS_REPOSITORY,
    MODE_SESSIONS_REPOSITORY,
    NFC_TAGS_REPOSITORY,
    INTERNAL_ANALYTICS_REPOSITORY,
    FOCUS_METRICS_REPOSITORY,
    FOCUS_SESSIONS_REPOSITORY,
    LANDING_WAITLIST_LEADS_REPOSITORY,
    EMERGENCY_UNLOCKS_REPOSITORY,
    LEGAL_DOCUMENTS_REPOSITORY,
  ],
})
export class DatabaseModule {}
