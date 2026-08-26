import {
  RitualBreakSettings,
  SaveRitualBreakSettingsData,
} from '../../entities/ritualBreaks/RitualBreakSettings';
import { IRitualBreaksRepository } from '../../adapters/repositories/ritualBreaks/IRitualBreaksRepository';

export class SaveRitualBreaksInteractor {
  constructor(
    private readonly ritualBreaksRepository: IRitualBreaksRepository,
  ) {}

  async execute(
    data: SaveRitualBreakSettingsData,
  ): Promise<RitualBreakSettings> {
    return this.ritualBreaksRepository.save(data);
  }
}
