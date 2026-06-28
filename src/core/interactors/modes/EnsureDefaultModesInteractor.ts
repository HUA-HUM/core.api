import { CreateModeData } from '../../entities/modes/Mode';
import { IModesRepository } from '../../adapters/repositories/modes/IModesRepository';

export class EnsureDefaultModesInteractor {
  constructor(private readonly modesRepository: IModesRepository) {}

  async execute(userId: string, modes: CreateModeData[]): Promise<void> {
    await this.modesRepository.ensureDefaultsForUser(userId, modes);
  }
}
