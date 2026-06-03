import { IRitualSessionsRepository } from '../../adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { RitualSession } from '../../entities/ritualSessions/RitualSession';

export class ListUserRitualSessionsInteractor {
  constructor(
    private readonly ritualSessionsRepository: IRitualSessionsRepository,
  ) {}

  async execute(userId: string): Promise<RitualSession[]> {
    return this.ritualSessionsRepository.findByUserId(userId);
  }
}
