import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { env } from '../../../config/env';
import { RITUALS_REPOSITORY } from '../../../core/adapters/repositories/rituals/IRitualsRepository';
import { RITUAL_BLOCKED_ITEMS_REPOSITORY } from '../../../core/adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import { RITUAL_SESSIONS_REPOSITORY } from '../../../core/adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { NFC_TAGS_REPOSITORY } from '../../../core/adapters/repositories/nfcTags/INfcTagsRepository';
import { INTERNAL_ANALYTICS_REPOSITORY } from '../../../core/adapters/repositories/internalAnalytics/IInternalAnalyticsRepository';
import { SQLRitualsRepository } from '../../drivers/repositories/rituals/SQLRitualsRepository';
import { SQLRitualBlockedItemsRepository } from '../../drivers/repositories/ritualBlockedItems/SQLRitualBlockedItemsRepository';
import { SQLRitualSessionsRepository } from '../../drivers/repositories/ritualSessions/SQLRitualSessionsRepository';
import { SQLNfcTagsRepository } from '../../drivers/repositories/nfcTags/SQLNfcTagsRepository';
import { SQLInternalAnalyticsRepository } from '../../drivers/repositories/internalAnalytics/SQLInternalAnalyticsRepository';

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
      provide: NFC_TAGS_REPOSITORY,
      useClass: SQLNfcTagsRepository,
    },
    {
      provide: INTERNAL_ANALYTICS_REPOSITORY,
      useClass: SQLInternalAnalyticsRepository,
    },
  ],
  exports: [
    RITUALS_REPOSITORY,
    RITUAL_BLOCKED_ITEMS_REPOSITORY,
    RITUAL_SESSIONS_REPOSITORY,
    NFC_TAGS_REPOSITORY,
    INTERNAL_ANALYTICS_REPOSITORY,
  ],
})
export class DatabaseModule {}
