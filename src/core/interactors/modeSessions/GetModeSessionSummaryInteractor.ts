import { IModeSessionsRepository } from '../../adapters/repositories/modeSessions/IModeSessionsRepository';
import { ModeSessionSummary } from '../../entities/modeSessions/ModeSessionSummary';

export class GetModeSessionSummaryInteractor {
  constructor(
    private readonly modeSessionsRepository: IModeSessionsRepository,
  ) {}

  async execute(userId: string): Promise<ModeSessionSummary> {
    return this.modeSessionsRepository.getSummaryByUserId(userId);
  }
}
