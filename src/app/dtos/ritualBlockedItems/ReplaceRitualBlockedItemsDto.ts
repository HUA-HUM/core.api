import {
  RitualBlockedItemPlatform,
  RitualBlockedItemType,
} from '../../../core/entities/ritualBlockedItems/RitualBlockedItem';

export class ReplaceRitualBlockedItemDto {
  platform?: RitualBlockedItemPlatform;
  type!: RitualBlockedItemType;
  identifier!: string;
  displayName?: string | null;
  applicationIdentifier?: string | null;
  bundleIdentifier?: string | null;
}

export class ReplaceRitualBlockedItemsDto {
  platform?: RitualBlockedItemPlatform;
  items!: ReplaceRitualBlockedItemDto[];
}
