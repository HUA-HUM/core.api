import { IRitualBlockedItemsRepository } from '../../adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import {
  CreateRitualBlockedItemData,
  RitualBlockedItem,
} from '../../entities/ritualBlockedItems/RitualBlockedItem';

export class ReplaceRitualBlockedItemsInteractor {
  constructor(
    private readonly ritualBlockedItemsRepository: IRitualBlockedItemsRepository,
  ) {}

  async execute(
    ritualId: string,
    items: CreateRitualBlockedItemData[],
  ): Promise<RitualBlockedItem[]> {
    return this.ritualBlockedItemsRepository.replaceForRitual(ritualId, items);
  }
}
