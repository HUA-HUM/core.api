import { Mode, UpdateModeData } from '../../entities/modes/Mode';
import { IModesRepository } from '../../adapters/repositories/modes/IModesRepository';

export class UpdateModeInteractor {
  constructor(private readonly modesRepository: IModesRepository) {}

  async execute(id: string, data: UpdateModeData): Promise<Mode | null> {
    return this.modesRepository.updateById(id, data);
  }
}
