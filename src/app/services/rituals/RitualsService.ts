import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateRitualData,
  Ritual,
} from '../../../core/entities/rituals/Ritual';
import { CreateRitualInteractor } from '../../../core/interactors/rituals/CreateRitualInteractor';
import { GetRitualInteractor } from '../../../core/interactors/rituals/GetRitualInteractor';
import { ListUserRitualsInteractor } from '../../../core/interactors/rituals/ListUserRitualsInteractor';

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
}

@Injectable()
export class RitualsService {
  constructor(
    private readonly createRitualInteractor: CreateRitualInteractor,
    private readonly listUserRitualsInteractor: ListUserRitualsInteractor,
    private readonly getRitualInteractor: GetRitualInteractor,
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

    const createRitualData: CreateRitualData = {
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
    };

    return this.createRitualInteractor.execute(createRitualData);
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
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
