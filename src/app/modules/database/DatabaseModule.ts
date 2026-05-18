import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { env } from '../../../config/env';
import { RITUALS_REPOSITORY } from '../../../core/adapters/repositories/rituals/IRitualsRepository';
import { SQLRitualsRepository } from '../../drivers/repositories/rituals/SQLRitualsRepository';

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
  ],
  exports: [RITUALS_REPOSITORY],
})
export class DatabaseModule {}
