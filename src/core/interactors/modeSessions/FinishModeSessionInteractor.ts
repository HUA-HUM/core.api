import { IModeSessionsRepository } from '../../adapters/repositories/modeSessions/IModeSessionsRepository';
import {
  FinishModeSessionData,
  ModeSession,
} from '../../entities/modeSessions/ModeSession';

export class FinishModeSessionInteractor {
  constructor(
    private readonly modeSessionsRepository: IModeSessionsRepository,
  ) {}

  async execute(data: FinishModeSessionData): Promise<ModeSession | null> {
    return this.modeSessionsRepository.finish(data);
  }
}
