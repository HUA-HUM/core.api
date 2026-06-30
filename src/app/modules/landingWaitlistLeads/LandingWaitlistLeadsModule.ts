import { Module } from '@nestjs/common';
import {
  ILandingWaitlistLeadsRepository,
  LANDING_WAITLIST_LEADS_REPOSITORY,
} from '../../../core/adapters/repositories/landingWaitlistLeads/ILandingWaitlistLeadsRepository';
import { CreateLandingWaitlistLeadInteractor } from '../../../core/interactors/landingWaitlistLeads/CreateLandingWaitlistLeadInteractor';
import { ListLandingWaitlistLeadsInteractor } from '../../../core/interactors/landingWaitlistLeads/ListLandingWaitlistLeadsInteractor';
import { LandingWaitlistLeadsController } from '../../controllers/landingWaitlistLeads/LandingWaitlistLeadsController';
import { InternalAnalyticsGuard } from '../../services/internalAnalytics/guards/InternalAnalyticsGuard';
import { LandingWaitlistLeadsService } from '../../services/landingWaitlistLeads/LandingWaitlistLeadsService';

@Module({
  controllers: [LandingWaitlistLeadsController],
  providers: [
    {
      provide: CreateLandingWaitlistLeadInteractor,
      useFactory: (repository: ILandingWaitlistLeadsRepository) =>
        new CreateLandingWaitlistLeadInteractor(repository),
      inject: [LANDING_WAITLIST_LEADS_REPOSITORY],
    },
    {
      provide: ListLandingWaitlistLeadsInteractor,
      useFactory: (repository: ILandingWaitlistLeadsRepository) =>
        new ListLandingWaitlistLeadsInteractor(repository),
      inject: [LANDING_WAITLIST_LEADS_REPOSITORY],
    },
    InternalAnalyticsGuard,
    LandingWaitlistLeadsService,
  ],
  exports: [LandingWaitlistLeadsService],
})
export class LandingWaitlistLeadsModule {}
