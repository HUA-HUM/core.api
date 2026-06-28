import {
  CreateModeBlockedItemData,
  ModeBlockedItem,
  ModeBlockedItemPlatform,
} from '../../../entities/modeBlockedItems/ModeBlockedItem';

export const MODE_BLOCKED_ITEMS_REPOSITORY = Symbol(
  'MODE_BLOCKED_ITEMS_REPOSITORY',
);

export interface IModeBlockedItemsRepository {
  findByModeId(
    modeId: string,
    platform: ModeBlockedItemPlatform,
  ): Promise<ModeBlockedItem[]>;
  replaceForMode(
    modeId: string,
    platform: ModeBlockedItemPlatform,
    items: CreateModeBlockedItemData[],
  ): Promise<ModeBlockedItem[]>;
}
