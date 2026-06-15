import {
  CreateRitualBlockedItemData,
  RitualBlockedItem,
  RitualBlockedItemPlatform,
} from '../../../entities/ritualBlockedItems/RitualBlockedItem';

export const RITUAL_BLOCKED_ITEMS_REPOSITORY = Symbol(
  'RITUAL_BLOCKED_ITEMS_REPOSITORY',
);

export interface IRitualBlockedItemsRepository {
  findByRitualId(
    ritualId: string,
    platform: RitualBlockedItemPlatform,
  ): Promise<RitualBlockedItem[]>;
  replaceForRitual(
    ritualId: string,
    platform: RitualBlockedItemPlatform,
    items: CreateRitualBlockedItemData[],
  ): Promise<RitualBlockedItem[]>;
}
