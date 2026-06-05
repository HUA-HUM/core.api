import { IRitualSessionsRepository } from '../../adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { RecordRitualSessionData, RitualSession } from '../../entities/ritualSessions/RitualSession';

export class RecordRitualSessionInteractor {
  constructor(
    private readonly ritualSessionsRepository: IRitualSessionsRepository,
  ) {}

  async execute(data: RecordRitualSessionData): Promise<RitualSession> {
    return this.ritualSessionsRepository.record(data);
  }
}
