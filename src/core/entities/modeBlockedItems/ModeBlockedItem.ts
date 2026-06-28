import {
  RitualBlockedItemPlatform,
  RitualBlockedItemType,
} from '../ritualBlockedItems/RitualBlockedItem';

export type ModeBlockedItemPlatform = RitualBlockedItemPlatform;
export type ModeBlockedItemType = RitualBlockedItemType;

export interface ModeBlockedItem {
  id: string;
  modeId: string;
  platform: ModeBlockedItemPlatform;
  type: ModeBlockedItemType;
  identifier: string;
  displayName: string | null;
  applicationIdentifier: string | null;
  bundleIdentifier: string | null;
  createdAt: Date;
}

export interface CreateModeBlockedItemData {
  modeId: string;
  platform: ModeBlockedItemPlatform;
  type: ModeBlockedItemType;
  identifier: string;
  displayName?: string | null;
  applicationIdentifier?: string | null;
  bundleIdentifier?: string | null;
}
