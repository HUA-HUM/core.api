import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Mode } from '../../../core/entities/modes/Mode';
import { EnsureDefaultModesInteractor } from '../../../core/interactors/modes/EnsureDefaultModesInteractor';
import { GetModeInteractor } from '../../../core/interactors/modes/GetModeInteractor';
import { ListUserModesInteractor } from '../../../core/interactors/modes/ListUserModesInteractor';
import { UpdateModeInteractor } from '../../../core/interactors/modes/UpdateModeInteractor';
import { ListModeBlockedItemsInteractor } from '../../../core/interactors/modeBlockedItems/ListModeBlockedItemsInteractor';
import { ReplaceModeBlockedItemsInteractor } from '../../../core/interactors/modeBlockedItems/ReplaceModeBlockedItemsInteractor';
import {
  CreateModeBlockedItemData,
  ModeBlockedItem,
  ModeBlockedItemPlatform,
  ModeBlockedItemType,
} from '../../../core/entities/modeBlockedItems/ModeBlockedItem';
import { RITUAL_PASSWORD_HASHER } from '../../../core/adapters/services/rituals/IRitualPasswordHasher';
import type { IRitualPasswordHasher } from '../../../core/adapters/services/rituals/IRitualPasswordHasher';

export interface ReplaceModeBlockedItemServiceData {
  platform?: ModeBlockedItemPlatform;
  type: ModeBlockedItemType;
  identifier: string;
  displayName?: string | null;
  applicationIdentifier?: string | null;
  bundleIdentifier?: string | null;
}

export interface UpdateModeServiceData {
  title: string;
  icon: string;
  appCount: number;
  categoryCount: number;
  domainCount: number;
  selectionDigest?: string | null;
  isProtected?: boolean;
  nfcUnlockEnabled?: boolean;
  password?: string | null;
}

@Injectable()
export class ModesService {
  private readonly defaultModes = [
    { templateKey: 'gym', title: 'Gimnasio', icon: 'dumbbell.fill' },
    { templateKey: 'meeting', title: 'Reunión', icon: 'person.2.fill' },
    { templateKey: 'reading', title: 'Lectura', icon: 'book.closed.fill' },
    { templateKey: 'work', title: 'Trabajar', icon: 'laptopcomputer' },
    { templateKey: 'sleep', title: 'Dormir', icon: 'moon.stars.fill' },
  ];

  constructor(
    private readonly ensureDefaultModesInteractor: EnsureDefaultModesInteractor,
    private readonly listUserModesInteractor: ListUserModesInteractor,
    private readonly getModeInteractor: GetModeInteractor,
    private readonly updateModeInteractor: UpdateModeInteractor,
    private readonly listModeBlockedItemsInteractor: ListModeBlockedItemsInteractor,
    private readonly replaceModeBlockedItemsInteractor: ReplaceModeBlockedItemsInteractor,
    @Inject(RITUAL_PASSWORD_HASHER)
    private readonly passwordHasher: IRitualPasswordHasher,
  ) {}

  async listByUserId(userId: string): Promise<Mode[]> {
    this.validateRequiredText(userId, 'userId');
    await this.ensureDefaultModes(userId);
    return this.listUserModesInteractor.execute(userId);
  }

  async getById(userId: string, id: string): Promise<Mode> {
    this.validateRequiredText(userId, 'userId');
    this.validateRequiredText(id, 'id');

    const mode = await this.getModeInteractor.execute(id);

    if (!mode || mode.userId !== userId) {
      throw new NotFoundException('mode not found');
    }

    return mode;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateModeServiceData,
  ): Promise<Mode> {
    const mode = await this.getById(userId, id);
    this.validateUpdateData(data);

    const isProtected = data.isProtected ?? false;
    const passwordHash = await this.resolvePasswordHash(
      mode,
      data,
      isProtected,
    );

    const updatedMode = await this.updateModeInteractor.execute(id, {
      title: data.title.trim(),
      icon: data.icon.trim(),
      appCount: data.appCount,
      categoryCount: data.categoryCount,
      domainCount: data.domainCount,
      selectionDigest: this.normalizeNullableText(data.selectionDigest),
      isProtected,
      nfcUnlockEnabled: isProtected ? (data.nfcUnlockEnabled ?? true) : false,
      passwordHash,
    });

    if (!updatedMode) {
      throw new NotFoundException('mode not found');
    }

    return updatedMode;
  }

  async rename(userId: string, id: string, title: string): Promise<Mode> {
    const mode = await this.getById(userId, id);
    const cleanTitle = title?.trim();

    if (!cleanTitle) {
      throw new BadRequestException('title is required');
    }

    if (cleanTitle.length > 40) {
      throw new BadRequestException('title must contain at most 40 characters');
    }

    const updatedMode = await this.updateModeInteractor.execute(id, {
      title: cleanTitle,
      icon: mode.icon,
      appCount: mode.appCount,
      categoryCount: mode.categoryCount,
      domainCount: mode.domainCount,
      selectionDigest: mode.selectionDigest,
      isProtected: mode.isProtected,
      nfcUnlockEnabled: mode.nfcUnlockEnabled,
      passwordHash: mode.passwordHash,
    });

    if (!updatedMode) {
      throw new NotFoundException('mode not found');
    }

    return updatedMode;
  }

  async listBlockedItems(
    userId: string,
    modeId: string,
    platform: ModeBlockedItemPlatform = 'ios',
  ): Promise<ModeBlockedItem[]> {
    await this.getById(userId, modeId);
    this.validatePlatform(platform);
    return this.listModeBlockedItemsInteractor.execute(modeId, platform);
  }

  async replaceBlockedItems(
    userId: string,
    modeId: string,
    platform: ModeBlockedItemPlatform | undefined,
    items: ReplaceModeBlockedItemServiceData[],
  ): Promise<ModeBlockedItem[]> {
    const mode = await this.getById(userId, modeId);

    if (!Array.isArray(items)) {
      throw new BadRequestException('items must be an array');
    }

    const targetPlatform = platform ?? items[0]?.platform ?? 'ios';
    this.validatePlatform(targetPlatform);

    if (
      items.some((item) => item.platform && item.platform !== targetPlatform)
    ) {
      throw new BadRequestException(
        'all item platforms must match the request platform',
      );
    }

    const normalizedItems = this.normalizeBlockedItems(
      modeId,
      targetPlatform,
      items,
    );

    const replacedItems = await this.replaceModeBlockedItemsInteractor.execute(
      modeId,
      targetPlatform,
      normalizedItems,
    );

    await this.updateModeInteractor.execute(modeId, {
      title: mode.title,
      icon: mode.icon,
      appCount: replacedItems.filter((item) => item.type === 'app').length,
      categoryCount: replacedItems.filter((item) => item.type === 'category')
        .length,
      domainCount: replacedItems.filter((item) => item.type === 'domain')
        .length,
      selectionDigest: this.selectionDigest(replacedItems),
      isProtected: mode.isProtected,
      nfcUnlockEnabled: mode.nfcUnlockEnabled,
      passwordHash: mode.passwordHash,
    });

    return replacedItems;
  }

  private async ensureDefaultModes(userId: string): Promise<void> {
    await this.ensureDefaultModesInteractor.execute(
      userId,
      this.defaultModes.map((mode) => ({
        userId,
        templateKey: mode.templateKey,
        title: mode.title,
        icon: mode.icon,
        appCount: 0,
        categoryCount: 0,
        domainCount: 0,
        selectionDigest: null,
        isProtected: false,
        nfcUnlockEnabled: false,
        passwordHash: null,
      })),
    );
  }

  private validateRequiredText(value: string, fieldName: string): void {
    if (!value?.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }

  private validateUpdateData(data: UpdateModeServiceData): void {
    if (!data.title.trim()) {
      throw new BadRequestException('title is required');
    }

    if (!data.icon.trim()) {
      throw new BadRequestException('icon is required');
    }

    if (data.appCount < 0 || data.categoryCount < 0 || data.domainCount < 0) {
      throw new BadRequestException(
        'selection counters must be greater than or equal to 0',
      );
    }
  }

  private async resolvePasswordHash(
    existingMode: Mode,
    data: UpdateModeServiceData,
    isProtected: boolean,
  ): Promise<string | null> {
    if (!isProtected) {
      return null;
    }

    const password = data.password?.trim() ?? '';
    if (password) {
      if (password.length < 4 || password.length > 72) {
        throw new BadRequestException(
          'password must contain between 4 and 72 characters',
        );
      }

      return this.passwordHasher.hash(password);
    }

    if (!existingMode.passwordHash) {
      throw new BadRequestException(
        'password must contain between 4 and 72 characters',
      );
    }

    return existingMode.passwordHash;
  }

  private normalizeBlockedItems(
    modeId: string,
    platform: ModeBlockedItemPlatform,
    items: ReplaceModeBlockedItemServiceData[],
  ): CreateModeBlockedItemData[] {
    if (!Array.isArray(items)) {
      throw new BadRequestException('items must be an array');
    }

    const seen = new Set<string>();

    return items.map((item) => {
      if (!['app', 'category', 'domain'].includes(item.type)) {
        throw new BadRequestException(
          'item type must be app, category or domain',
        );
      }

      const identifier = item.identifier?.trim();
      if (!identifier) {
        throw new BadRequestException('item identifier is required');
      }

      const dedupeKey = `${platform}:${item.type}:${identifier}`;
      if (seen.has(dedupeKey)) {
        throw new BadRequestException('duplicated blocked item');
      }
      seen.add(dedupeKey);

      return {
        modeId,
        platform,
        type: item.type,
        identifier,
        displayName: this.normalizeNullableText(item.displayName),
        applicationIdentifier: this.normalizeNullableText(
          item.applicationIdentifier ?? item.bundleIdentifier,
        ),
        bundleIdentifier: this.normalizeNullableText(item.bundleIdentifier),
      };
    });
  }

  private validatePlatform(
    platform: string,
  ): asserts platform is ModeBlockedItemPlatform {
    if (!['ios', 'android'].includes(platform)) {
      throw new BadRequestException('platform must be ios or android');
    }
  }

  private selectionDigest(items: ModeBlockedItem[]): string | null {
    const appCount = items.filter((item) => item.type === 'app').length;
    const categoryCount = items.filter(
      (item) => item.type === 'category',
    ).length;
    const domainCount = items.filter((item) => item.type === 'domain').length;

    if (appCount === 0 && categoryCount === 0 && domainCount === 0) {
      return null;
    }

    const parts: string[] = [];
    if (appCount > 0) {
      parts.push(`${appCount} app${appCount === 1 ? '' : 's'}`);
    }
    if (categoryCount > 0) {
      parts.push(`${categoryCount} categoria${categoryCount === 1 ? '' : 's'}`);
    }
    if (domainCount > 0) {
      parts.push(`${domainCount} web`);
    }

    return parts.join(', ');
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
