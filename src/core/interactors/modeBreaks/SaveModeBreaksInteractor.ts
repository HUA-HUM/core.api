import {
  ModeBreakSettings,
  SaveModeBreakSettingsData,
} from '../../entities/modeBreaks/ModeBreakSettings';
import { IModeBreaksRepository } from '../../adapters/repositories/modeBreaks/IModeBreaksRepository';

export class SaveModeBreaksInteractor {
  constructor(private readonly modeBreaksRepository: IModeBreaksRepository) {}

  async execute(data: SaveModeBreakSettingsData): Promise<ModeBreakSettings> {
    return this.modeBreaksRepository.save(data);
  }
}
