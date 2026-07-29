import { Module } from '@nestjs/common';
import { SupportResetsController } from '../../controllers/supportResets/SupportResetsController';
import { InternalAnalyticsGuard } from '../../services/internalAnalytics/guards/InternalAnalyticsGuard';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';
import { InitialSupportResetsService } from '../../services/supportResets/InitialSupportResetsService';
import { SupportResetsService } from '../../services/supportResets/SupportResetsService';

@Module({
  imports: [JwtAuthModule],
  controllers: [SupportResetsController],
  providers: [
    SupportResetsService,
    InitialSupportResetsService,
    InternalAnalyticsGuard,
  ],
})
export class SupportResetsModule {}
