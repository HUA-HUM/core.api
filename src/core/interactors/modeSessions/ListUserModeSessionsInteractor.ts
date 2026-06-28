import { IModeSessionsRepository } from '../../adapters/repositories/modeSessions/IModeSessionsRepository';
import { ModeSession } from '../../entities/modeSessions/ModeSession';

export class ListUserModeSessionsInteractor {
  constructor(
    private readonly modeSessionsRepository: IModeSessionsRepository,
  ) {}

  async execute(userId: string): Promise<ModeSession[]> {
    return this.modeSessionsRepository.findByUserId(userId);
  }
}
