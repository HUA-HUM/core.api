import { IRitualBlockedItemsRepository } from '../../adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import { RitualBlockedItem } from '../../entities/ritualBlockedItems/RitualBlockedItem';

export class ListRitualBlockedItemsInteractor {
  constructor(
    private readonly ritualBlockedItemsRepository: IRitualBlockedItemsRepository,
  ) {}

  async execute(ritualId: string): Promise<RitualBlockedItem[]> {
    return this.ritualBlockedItemsRepository.findByRitualId(ritualId);
  }
}
