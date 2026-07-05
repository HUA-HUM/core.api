import { IModeSessionsRepository } from '../../adapters/repositories/modeSessions/IModeSessionsRepository';
import { ModeSession } from '../../entities/modeSessions/ModeSession';

export class GetModeSessionInteractor {
  constructor(
    private readonly modeSessionsRepository: IModeSessionsRepository,
  ) {}

  async execute(id: string): Promise<ModeSession | null> {
    return this.modeSessionsRepository.findById(id);
  }
}
