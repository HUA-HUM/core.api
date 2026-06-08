import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/DatabaseModule';
import { HealthModule } from './health.module';
import { RitualsModule } from './rituals/RitualsModule';
import { RitualSessionsModule } from './ritualSessions/RitualSessionsModule';
import { NfcTagsModule } from './nfcTags/NfcTagsModule';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    RitualsModule,
    RitualSessionsModule,
    NfcTagsModule,
  ],
})
export class AppModule {}
