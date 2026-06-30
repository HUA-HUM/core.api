import { ILandingWaitlistLeadsRepository } from '../../adapters/repositories/landingWaitlistLeads/ILandingWaitlistLeadsRepository';
import { LandingWaitlistLead } from '../../entities/landingWaitlistLeads/LandingWaitlistLead';

export class ListLandingWaitlistLeadsInteractor {
  constructor(
    private readonly landingWaitlistLeadsRepository: ILandingWaitlistLeadsRepository,
  ) {}

  async execute(): Promise<LandingWaitlistLead[]> {
    return this.landingWaitlistLeadsRepository.findAll();
  }
}
