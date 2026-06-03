import { IRitualSessionsRepository } from '../../adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { RitualSession } from '../../entities/ritualSessions/RitualSession';

export class GetActiveRitualSessionInteractor {
  constructor(
    private readonly ritualSessionsRepository: IRitualSessionsRepository,
  ) {}

  async execute(userId: string): Promise<RitualSession | null> {
    return this.ritualSessionsRepository.findActiveByUserId(userId);
  }
}
