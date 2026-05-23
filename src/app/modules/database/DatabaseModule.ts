import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { env } from '../../../config/env';
import { RITUALS_REPOSITORY } from '../../../core/adapters/repositories/rituals/IRitualsRepository';
import { RITUAL_BLOCKED_ITEMS_REPOSITORY } from '../../../core/adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import { SQLRitualsRepository } from '../../drivers/repositories/rituals/SQLRitualsRepository';
import { SQLRitualBlockedItemsRepository } from '../../drivers/repositories/ritualBlockedItems/SQLRitualBlockedItemsRepository';

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
  ],
  exports: [RITUALS_REPOSITORY, RITUAL_BLOCKED_ITEMS_REPOSITORY],
})
export class DatabaseModule {}
