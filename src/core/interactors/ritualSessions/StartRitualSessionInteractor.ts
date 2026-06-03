import { IRitualSessionsRepository } from '../../adapters/repositories/ritualSessions/IRitualSessionsRepository';
import {
  RitualSession,
  StartRitualSessionData,
} from '../../entities/ritualSessions/RitualSession';

export class StartRitualSessionInteractor {
  constructor(
    private readonly ritualSessionsRepository: IRitualSessionsRepository,
  ) {}

  async execute(data: StartRitualSessionData): Promise<RitualSession> {
    return this.ritualSessionsRepository.create(data);
  }
}
