import { IRitualSessionsRepository } from '../../adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { RitualSessionSummary } from '../../entities/ritualSessions/RitualSessionSummary';

export class GetRitualSessionSummaryInteractor {
  constructor(
    private readonly ritualSessionsRepository: IRitualSessionsRepository,
  ) {}

  async execute(userId: string): Promise<RitualSessionSummary> {
    return this.ritualSessionsRepository.getSummaryByUserId(userId);
  }
}
