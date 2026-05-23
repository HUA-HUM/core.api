import {
  RitualBlockedItem,
  RitualBlockedItemType,
} from '../../../core/entities/ritualBlockedItems/RitualBlockedItem';

export class RitualBlockedItemResponseDto {
  id!: string;
  ritualId!: string;
  type!: RitualBlockedItemType;
  identifier!: string;
  displayName!: string | null;
  bundleIdentifier!: string | null;
  createdAt!: string;

  static fromEntity(item: RitualBlockedItem): RitualBlockedItemResponseDto {
    return {
      id: item.id,
      ritualId: item.ritualId,
      type: item.type,
      identifier: item.identifier,
      displayName: item.displayName,
      bundleIdentifier: item.bundleIdentifier,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
