import { RitualBlockedItemType } from '../../../core/entities/ritualBlockedItems/RitualBlockedItem';

export class ReplaceRitualBlockedItemDto {
  type!: RitualBlockedItemType;
  identifier!: string;
  displayName?: string | null;
  bundleIdentifier?: string | null;
}

export class ReplaceRitualBlockedItemsDto {
  items!: ReplaceRitualBlockedItemDto[];
}
