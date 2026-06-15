import {
  RitualBlockedItem,
  RitualBlockedItemPlatform,
  RitualBlockedItemType,
} from '../../../core/entities/ritualBlockedItems/RitualBlockedItem';

export class RitualBlockedItemResponseDto {
  id!: string;
  ritualId!: string;
  platform!: RitualBlockedItemPlatform;
  type!: RitualBlockedItemType;
  identifier!: string;
  displayName!: string | null;
  applicationIdentifier!: string | null;
  bundleIdentifier!: string | null;
  createdAt!: string;

  static fromEntity(item: RitualBlockedItem): RitualBlockedItemResponseDto {
    return {
      id: item.id,
      ritualId: item.ritualId,
      platform: item.platform,
      type: item.type,
      identifier: item.identifier,
      displayName: item.displayName,
      applicationIdentifier: item.applicationIdentifier,
      bundleIdentifier: item.bundleIdentifier,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
