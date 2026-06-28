import { Mode } from '../../entities/modes/Mode';
import { IModesRepository } from '../../adapters/repositories/modes/IModesRepository';

export class ListUserModesInteractor {
  constructor(private readonly modesRepository: IModesRepository) {}

  async execute(userId: string): Promise<Mode[]> {
    return this.modesRepository.findByUserId(userId);
  }
}
