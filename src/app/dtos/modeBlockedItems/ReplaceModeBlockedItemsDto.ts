import {
  ModeBlockedItemPlatform,
  ModeBlockedItemType,
} from '../../../core/entities/modeBlockedItems/ModeBlockedItem';

export class ReplaceModeBlockedItemDto {
  platform?: ModeBlockedItemPlatform;
  type!: ModeBlockedItemType;
  identifier!: string;
  displayName?: string | null;
  applicationIdentifier?: string | null;
  bundleIdentifier?: string | null;
}

export class ReplaceModeBlockedItemsDto {
  platform?: ModeBlockedItemPlatform;
  items!: ReplaceModeBlockedItemDto[];
}
