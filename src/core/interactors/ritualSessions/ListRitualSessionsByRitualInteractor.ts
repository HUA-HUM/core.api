import { IRitualSessionsRepository } from '../../adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { RitualSession } from '../../entities/ritualSessions/RitualSession';

export class ListRitualSessionsByRitualInteractor {
  constructor(
    private readonly ritualSessionsRepository: IRitualSessionsRepository,
  ) {}

  async execute(userId: string, ritualId: string): Promise<RitualSession[]> {
    return this.ritualSessionsRepository.findByUserIdAndRitualId(
      userId,
      ritualId,
    );
  }
}
