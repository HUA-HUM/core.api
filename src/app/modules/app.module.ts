import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/DatabaseModule';
import { HealthModule } from './health.module';
import { RitualsModule } from './rituals/RitualsModule';
import { RitualSessionsModule } from './ritualSessions/RitualSessionsModule';

@Module({
  imports: [DatabaseModule, HealthModule, RitualsModule, RitualSessionsModule],
})
export class AppModule {}
