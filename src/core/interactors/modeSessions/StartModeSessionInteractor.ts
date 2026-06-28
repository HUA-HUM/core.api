import { IModeSessionsRepository } from '../../adapters/repositories/modeSessions/IModeSessionsRepository';
import {
  ModeSession,
  StartModeSessionData,
} from '../../entities/modeSessions/ModeSession';

export class StartModeSessionInteractor {
  constructor(
    private readonly modeSessionsRepository: IModeSessionsRepository,
  ) {}

  async execute(data: StartModeSessionData): Promise<ModeSession> {
    return this.modeSessionsRepository.create(data);
  }
}
