import {
  CreateLandingWaitlistLeadData,
  LandingWaitlistLead,
} from '../../../entities/landingWaitlistLeads/LandingWaitlistLead';

export const LANDING_WAITLIST_LEADS_REPOSITORY = Symbol(
  'LANDING_WAITLIST_LEADS_REPOSITORY',
);

export interface ILandingWaitlistLeadsRepository {
  save(data: CreateLandingWaitlistLeadData): Promise<LandingWaitlistLead>;
  findAll(): Promise<LandingWaitlistLead[]>;
}
