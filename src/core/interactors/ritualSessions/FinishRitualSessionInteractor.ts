import { IRitualSessionsRepository } from '../../adapters/repositories/ritualSessions/IRitualSessionsRepository';
import {
  FinishRitualSessionData,
  RitualSession,
} from '../../entities/ritualSessions/RitualSession';

export class FinishRitualSessionInteractor {
  constructor(
    private readonly ritualSessionsRepository: IRitualSessionsRepository,
  ) {}

  async execute(data: FinishRitualSessionData): Promise<RitualSession | null> {
    return this.ritualSessionsRepository.finish(data);
  }
}
