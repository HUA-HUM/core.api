import {
  ModeBlockedItem,
  ModeBlockedItemPlatform,
} from '../../entities/modeBlockedItems/ModeBlockedItem';
import { IModeBlockedItemsRepository } from '../../adapters/repositories/modeBlockedItems/IModeBlockedItemsRepository';

export class ListModeBlockedItemsInteractor {
  constructor(
    private readonly modeBlockedItemsRepository: IModeBlockedItemsRepository,
  ) {}

  async execute(
    modeId: string,
    platform: ModeBlockedItemPlatform,
  ): Promise<ModeBlockedItem[]> {
    return this.modeBlockedItemsRepository.findByModeId(modeId, platform);
  }
}
