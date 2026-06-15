import { IRitualBlockedItemsRepository } from '../../adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import {
  CreateRitualBlockedItemData,
  RitualBlockedItem,
  RitualBlockedItemPlatform,
} from '../../entities/ritualBlockedItems/RitualBlockedItem';

export class ReplaceRitualBlockedItemsInteractor {
  constructor(
    private readonly ritualBlockedItemsRepository: IRitualBlockedItemsRepository,
  ) {}

  async execute(
    ritualId: string,
    platform: RitualBlockedItemPlatform,
    items: CreateRitualBlockedItemData[],
  ): Promise<RitualBlockedItem[]> {
    return this.ritualBlockedItemsRepository.replaceForRitual(
      ritualId,
      platform,
      items,
    );
  }
}
