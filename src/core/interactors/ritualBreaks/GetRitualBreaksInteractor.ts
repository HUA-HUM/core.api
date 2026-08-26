import { RitualBreakSettings } from '../../entities/ritualBreaks/RitualBreakSettings';
import { IRitualBreaksRepository } from '../../adapters/repositories/ritualBreaks/IRitualBreaksRepository';

export class GetRitualBreaksInteractor {
  constructor(
    private readonly ritualBreaksRepository: IRitualBreaksRepository,
  ) {}

  async execute(ritualId: string): Promise<RitualBreakSettings | null> {
    return this.ritualBreaksRepository.findByRitualId(ritualId);
  }
}
