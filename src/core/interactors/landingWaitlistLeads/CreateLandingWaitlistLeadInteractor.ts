import { ILandingWaitlistLeadsRepository } from '../../adapters/repositories/landingWaitlistLeads/ILandingWaitlistLeadsRepository';
import {
  CreateLandingWaitlistLeadData,
  LandingWaitlistLead,
} from '../../entities/landingWaitlistLeads/LandingWaitlistLead';

export class CreateLandingWaitlistLeadInteractor {
  constructor(
    private readonly landingWaitlistLeadsRepository: ILandingWaitlistLeadsRepository,
  ) {}

  async execute(
    data: CreateLandingWaitlistLeadData,
  ): Promise<LandingWaitlistLead> {
    return this.landingWaitlistLeadsRepository.save(data);
  }
}
