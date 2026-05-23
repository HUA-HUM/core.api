export type RitualBlockedItemType = 'app' | 'category' | 'domain';

export interface RitualBlockedItem {
  id: string;
  ritualId: string;
  type: RitualBlockedItemType;
  identifier: string;
  displayName: string | null;
  bundleIdentifier: string | null;
  createdAt: Date;
}

export interface CreateRitualBlockedItemData {
  ritualId: string;
  type: RitualBlockedItemType;
  identifier: string;
  displayName?: string | null;
  bundleIdentifier?: string | null;
}
