import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Ritual } from '../../../core/entities/rituals/Ritual';
import {
  CreateRitualInteractor,
  CreateRitualInteractorData,
} from '../../../core/interactors/rituals/CreateRitualInteractor';
import { GetRitualInteractor } from '../../../core/interactors/rituals/GetRitualInteractor';
import { DeleteRitualInteractor } from '../../../core/interactors/rituals/DeleteRitualInteractor';
import { ListUserRitualsInteractor } from '../../../core/interactors/rituals/ListUserRitualsInteractor';
import { ListRitualBlockedItemsInteractor } from '../../../core/interactors/ritualBlockedItems/ListRitualBlockedItemsInteractor';
import { ReplaceRitualBlockedItemsInteractor } from '../../../core/interactors/ritualBlockedItems/ReplaceRitualBlockedItemsInteractor';
import {
  CreateRitualBlockedItemData,
  RitualBlockedItem,
  RitualBlockedItemPlatform,
  RitualBlockedItemType,
} from '../../../core/entities/ritualBlockedItems/RitualBlockedItem';
import { RitualProtectionError } from '../../../core/interactors/rituals/RitualProtectionError';

export interface ReplaceRitualBlockedItemServiceData {
  platform?: RitualBlockedItemPlatform;
  type: RitualBlockedItemType;
  identifier: string;
  displayName?: string | null;
  applicationIdentifier?: string | null;
  bundleIdentifier?: string | null;
}

export interface CreateRitualServiceData {
  userId: string;
  title: string;
  description?: string | null;
  icon: string;
  durationMinutes: number;
  weekdays: number[];
  startTime?: string | null;
  endTime?: string | null;
  appCount: number;
  categoryCount: number;
  domainCount: number;
  selectionDigest?: string | null;
  isProtected?: boolean;
  nfcUnlockEnabled?: boolean;
  password?: string | null;
}

@Injectable()
export class RitualsService {
  constructor(
    private readonly createRitualInteractor: CreateRitualInteractor,
    private readonly listUserRitualsInteractor: ListUserRitualsInteractor,
    private readonly getRitualInteractor: GetRitualInteractor,
    private readonly deleteRitualInteractor: DeleteRitualInteractor,
    private readonly listRitualBlockedItemsInteractor: ListRitualBlockedItemsInteractor,
    private readonly replaceRitualBlockedItemsInteractor: ReplaceRitualBlockedItemsInteractor,
  ) {}

  async listByUserId(userId: string): Promise<Ritual[]> {
    this.validateRequiredText(userId, 'userId');

    return this.listUserRitualsInteractor.execute(userId);
  }

  async getById(userId: string, id: string): Promise<Ritual> {
    this.validateRequiredText(userId, 'userId');
    this.validateRequiredText(id, 'id');

    const ritual = await this.getRitualInteractor.execute(id);

    if (!ritual || ritual.userId !== userId) {
      throw new NotFoundException('ritual not found');
    }

    return ritual;
  }

  async create(data: CreateRitualServiceData): Promise<Ritual> {
    this.validateCreateData(data);

    const isProtected = data.isProtected ?? false;
    const nfcUnlockEnabled = data.nfcUnlockEnabled ?? false;
    const createRitualData: CreateRitualInteractorData = {
      userId: data.userId,
      title: data.title.trim(),
      description: this.normalizeNullableText(data.description),
      icon: data.icon.trim(),
      durationMinutes: data.durationMinutes,
      weekdays: data.weekdays,
      startTime: this.normalizeNullableText(data.startTime),
      endTime: this.normalizeNullableText(data.endTime),
      appCount: data.appCount,
      categoryCount: data.categoryCount,
      domainCount: data.domainCount,
      selectionDigest: this.normalizeNullableText(data.selectionDigest),
      isProtected,
      nfcUnlockEnabled,
      password: isProtected ? data.password?.trim() : null,
    };

    return this.createRitualInteractor.execute(createRitualData);
  }

  async delete(
    userId: string,
    id: string,
    password?: string | null,
  ): Promise<void> {
    const ritual = await this.getById(userId, id);

    try {
      await this.deleteRitualInteractor.execute(ritual, password?.trim());
    } catch (error) {
      if (error instanceof RitualProtectionError) {
        throw new ForbiddenException(
          error.code === 'RITUAL_PASSWORD_REQUIRED'
            ? 'ritual password is required'
            : 'invalid ritual password',
        );
      }

      throw error;
    }
  }

  async listBlockedItems(
    userId: string,
    ritualId: string,
    platform: RitualBlockedItemPlatform = 'ios',
  ): Promise<RitualBlockedItem[]> {
    await this.getById(userId, ritualId);
    this.validatePlatform(platform);
    return this.listRitualBlockedItemsInteractor.execute(ritualId, platform);
  }

  async replaceBlockedItems(
    userId: string,
    ritualId: string,
    platform: RitualBlockedItemPlatform | undefined,
    items: ReplaceRitualBlockedItemServiceData[],
  ): Promise<RitualBlockedItem[]> {
    await this.getById(userId, ritualId);

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
      ritualId,
      targetPlatform,
      items,
    );
    return this.replaceRitualBlockedItemsInteractor.execute(
      ritualId,
      targetPlatform,
      normalizedItems,
    );
  }

  private validateRequiredText(value: string, fieldName: string): void {
    if (!value?.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }

  private validateCreateData(data: CreateRitualServiceData): void {
    if (!data.userId.trim()) {
      throw new BadRequestException('userId is required');
    }

    if (!data.title.trim()) {
      throw new BadRequestException('title is required');
    }

    if (!data.icon.trim()) {
      throw new BadRequestException('icon is required');
    }

    if (!Number.isInteger(data.durationMinutes) || data.durationMinutes <= 0) {
      throw new BadRequestException('durationMinutes must be greater than 0');
    }

    if (!Array.isArray(data.weekdays) || data.weekdays.length === 0) {
      throw new BadRequestException('at least one weekday is required');
    }

    if (
      data.weekdays.some(
        (weekday) => !Number.isInteger(weekday) || weekday < 1 || weekday > 7,
      )
    ) {
      throw new BadRequestException(
        'weekdays must contain values between 1 and 7',
      );
    }

    if (data.appCount < 0 || data.categoryCount < 0 || data.domainCount < 0) {
      throw new BadRequestException(
        'selection counters must be greater than or equal to 0',
      );
    }

    if (data.isProtected) {
      const password = data.password?.trim() ?? '';

      if (password.length < 4 || password.length > 72) {
        throw new BadRequestException(
          'password must contain between 4 and 72 characters',
        );
      }
    }
  }

  private normalizeBlockedItems(
    ritualId: string,
    platform: RitualBlockedItemPlatform,
    items: ReplaceRitualBlockedItemServiceData[],
  ): CreateRitualBlockedItemData[] {
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
        ritualId,
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
  ): asserts platform is RitualBlockedItemPlatform {
    if (!['ios', 'android'].includes(platform)) {
      throw new BadRequestException('platform must be ios or android');
    }
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
