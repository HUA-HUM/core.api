export type RitualBlockedItemType = 'app' | 'category' | 'domain';
export type RitualBlockedItemPlatform = 'ios' | 'android';

export interface RitualBlockedItem {
  id: string;
  ritualId: string;
  platform: RitualBlockedItemPlatform;
  type: RitualBlockedItemType;
  identifier: string;
  displayName: string | null;
  applicationIdentifier: string | null;
  bundleIdentifier: string | null;
  createdAt: Date;
}

export interface CreateRitualBlockedItemData {
  ritualId: string;
  platform?: RitualBlockedItemPlatform;
  type: RitualBlockedItemType;
  identifier: string;
  displayName?: string | null;
  applicationIdentifier?: string | null;
  bundleIdentifier?: string | null;
}
