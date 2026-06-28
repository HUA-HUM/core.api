import { IModeSessionsRepository } from '../../adapters/repositories/modeSessions/IModeSessionsRepository';
import { ModeSession } from '../../entities/modeSessions/ModeSession';

export class GetActiveModeSessionInteractor {
  constructor(
    private readonly modeSessionsRepository: IModeSessionsRepository,
  ) {}

  async execute(userId: string): Promise<ModeSession | null> {
    return this.modeSessionsRepository.findActiveByUserId(userId);
  }
}
