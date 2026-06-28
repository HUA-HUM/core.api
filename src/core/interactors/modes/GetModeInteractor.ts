import { Mode } from '../../entities/modes/Mode';
import { IModesRepository } from '../../adapters/repositories/modes/IModesRepository';

export class GetModeInteractor {
  constructor(private readonly modesRepository: IModesRepository) {}

  async execute(id: string): Promise<Mode | null> {
    return this.modesRepository.findById(id);
  }
}
