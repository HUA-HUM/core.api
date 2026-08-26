import { ModeBreakSettings } from '../../entities/modeBreaks/ModeBreakSettings';
import { IModeBreaksRepository } from '../../adapters/repositories/modeBreaks/IModeBreaksRepository';

export class GetModeBreaksInteractor {
  constructor(private readonly modeBreaksRepository: IModeBreaksRepository) {}

  async execute(modeId: string): Promise<ModeBreakSettings | null> {
    return this.modeBreaksRepository.findByModeId(modeId);
  }
}
