import { IModeSessionsRepository } from '../../adapters/repositories/modeSessions/IModeSessionsRepository';
import { ModeSession } from '../../entities/modeSessions/ModeSession';

export class ListModeSessionsByModeInteractor {
  constructor(
    private readonly modeSessionsRepository: IModeSessionsRepository,
  ) {}

  async execute(userId: string, modeId: string): Promise<ModeSession[]> {
    return this.modeSessionsRepository.findByUserIdAndModeId(userId, modeId);
  }
}
