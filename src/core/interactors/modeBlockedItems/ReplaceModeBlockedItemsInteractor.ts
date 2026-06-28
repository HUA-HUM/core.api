import {
  CreateModeBlockedItemData,
  ModeBlockedItem,
  ModeBlockedItemPlatform,
} from '../../entities/modeBlockedItems/ModeBlockedItem';
import { IModeBlockedItemsRepository } from '../../adapters/repositories/modeBlockedItems/IModeBlockedItemsRepository';

export class ReplaceModeBlockedItemsInteractor {
  constructor(
    private readonly modeBlockedItemsRepository: IModeBlockedItemsRepository,
  ) {}

  async execute(
    modeId: string,
    platform: ModeBlockedItemPlatform,
    items: CreateModeBlockedItemData[],
  ): Promise<ModeBlockedItem[]> {
    return this.modeBlockedItemsRepository.replaceForMode(
      modeId,
      platform,
      items,
    );
  }
}
