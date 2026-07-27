import { Module } from '@nestjs/common';
import { LegalDocumentsController } from '../../controllers/legal/LegalDocumentsController';
import { InternalAnalyticsGuard } from '../../services/internalAnalytics/guards/InternalAnalyticsGuard';
import { InitialLegalDocumentsService } from '../../services/legal/InitialLegalDocumentsService';
import { LegalDocumentsService } from '../../services/legal/LegalDocumentsService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

@Module({
  imports: [JwtAuthModule],
  controllers: [LegalDocumentsController],
  providers: [
    LegalDocumentsService,
    InitialLegalDocumentsService,
    InternalAnalyticsGuard,
  ],
})
export class LegalDocumentsModule {}
