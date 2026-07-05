import { IRitualSessionsRepository } from '../../adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { RitualSession } from '../../entities/ritualSessions/RitualSession';

export class GetRitualSessionInteractor {
  constructor(
    private readonly ritualSessionsRepository: IRitualSessionsRepository,
  ) {}

  async execute(id: string): Promise<RitualSession | null> {
    return this.ritualSessionsRepository.findById(id);
  }
}
