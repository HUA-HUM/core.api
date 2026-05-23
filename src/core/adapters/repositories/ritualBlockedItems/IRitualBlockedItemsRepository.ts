import {
  CreateRitualBlockedItemData,
  RitualBlockedItem,
} from '../../../entities/ritualBlockedItems/RitualBlockedItem';

export const RITUAL_BLOCKED_ITEMS_REPOSITORY = Symbol(
  'RITUAL_BLOCKED_ITEMS_REPOSITORY',
);

export interface IRitualBlockedItemsRepository {
  findByRitualId(ritualId: string): Promise<RitualBlockedItem[]>;
  replaceForRitual(
    ritualId: string,
    items: CreateRitualBlockedItemData[],
  ): Promise<RitualBlockedItem[]>;
}
