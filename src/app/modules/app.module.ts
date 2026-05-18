import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/DatabaseModule';
import { HealthModule } from './health.module';
import { RitualsModule } from './rituals/RitualsModule';

@Module({
  imports: [DatabaseModule, HealthModule, RitualsModule],
})
export class AppModule {}
