import {
  ModeBlockedItem,
  ModeBlockedItemPlatform,
  ModeBlockedItemType,
} from '../../../core/entities/modeBlockedItems/ModeBlockedItem';

export class ModeBlockedItemResponseDto {
  id!: string;
  modeId!: string;
  platform!: ModeBlockedItemPlatform;
  type!: ModeBlockedItemType;
  identifier!: string;
  displayName!: string | null;
  applicationIdentifier!: string | null;
  bundleIdentifier!: string | null;
  createdAt!: string;

  static fromEntity(item: ModeBlockedItem): ModeBlockedItemResponseDto {
    return {
      id: item.id,
      modeId: item.modeId,
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
