import { IRitualBlockedItemsRepository } from '../../adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import {
  RitualBlockedItem,
  RitualBlockedItemPlatform,
} from '../../entities/ritualBlockedItems/RitualBlockedItem';

export class ListRitualBlockedItemsInteractor {
  constructor(
    private readonly ritualBlockedItemsRepository: IRitualBlockedItemsRepository,
  ) {}

  async execute(
    ritualId: string,
    platform: RitualBlockedItemPlatform,
  ): Promise<RitualBlockedItem[]> {
    return this.ritualBlockedItemsRepository.findByRitualId(ritualId, platform);
  }
}
