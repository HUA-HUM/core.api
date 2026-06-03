import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RitualsService } from '../rituals/RitualsService';
import { GetActiveRitualSessionInteractor } from '../../../core/interactors/ritualSessions/GetActiveRitualSessionInteractor';
import { FinishRitualSessionInteractor } from '../../../core/interactors/ritualSessions/FinishRitualSessionInteractor';
import { ListUserRitualSessionsInteractor } from '../../../core/interactors/ritualSessions/ListUserRitualSessionsInteractor';
import { StartRitualSessionInteractor } from '../../../core/interactors/ritualSessions/StartRitualSessionInteractor';
import {
  RitualSession,
  RitualSessionEndSource,
  RitualSessionStartSource,
  RitualSessionStatus,
} from '../../../core/entities/ritualSessions/RitualSession';

export interface StartRitualSessionServiceData {
  userId: string;
  ritualId: string;
  plannedEndAt?: string | null;
  startSource: RitualSessionStartSource;
}

export interface FinishRitualSessionServiceData {
  userId: string;
  sessionId: string;
  status?: Exclude<RitualSessionStatus, 'active'>;
  endSource: RitualSessionEndSource;
}

@Injectable()
export class RitualSessionsService {
  constructor(
    private readonly ritualsService: RitualsService,
    private readonly startRitualSessionInteractor: StartRitualSessionInteractor,
    private readonly getActiveRitualSessionInteractor: GetActiveRitualSessionInteractor,
    private readonly listUserRitualSessionsInteractor: ListUserRitualSessionsInteractor,
    private readonly finishRitualSessionInteractor: FinishRitualSessionInteractor,
  ) {}

  async start(data: StartRitualSessionServiceData): Promise<RitualSession> {
    this.validateRequiredText(data.userId, 'userId');
    this.validateRequiredText(data.ritualId, 'ritualId');
    this.validateStartSource(data.startSource);

    await this.ritualsService.getById(data.userId, data.ritualId);

    const activeSession = await this.getActiveRitualSessionInteractor.execute(
      data.userId,
    );

    if (activeSession) {
      throw new ConflictException('user already has an active ritual session');
    }

    return this.startRitualSessionInteractor.execute({
      userId: data.userId,
      ritualId: data.ritualId,
      plannedEndAt: this.parseOptionalDate(data.plannedEndAt, 'plannedEndAt'),
      startSource: data.startSource,
    });
  }

  async getActive(userId: string): Promise<RitualSession | null> {
    this.validateRequiredText(userId, 'userId');
    return this.getActiveRitualSessionInteractor.execute(userId);
  }

  async list(userId: string): Promise<RitualSession[]> {
    this.validateRequiredText(userId, 'userId');
    return this.listUserRitualSessionsInteractor.execute(userId);
  }

  async finish(data: FinishRitualSessionServiceData): Promise<RitualSession> {
    this.validateRequiredText(data.userId, 'userId');
    this.validateRequiredText(data.sessionId, 'sessionId');
    this.validateEndSource(data.endSource);

    const status = data.status ?? 'completed';
    if (!['completed', 'cancelled'].includes(status)) {
      throw new BadRequestException('status must be completed or cancelled');
    }

    const session = await this.finishRitualSessionInteractor.execute({
      id: data.sessionId,
      userId: data.userId,
      status,
      endSource: data.endSource,
    });

    if (!session) {
      throw new NotFoundException('active ritual session not found');
    }

    return session;
  }

  private validateRequiredText(value: string, fieldName: string): void {
    if (!value?.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }

  private validateStartSource(value: RitualSessionStartSource): void {
    if (!['manual', 'schedule', 'nfc'].includes(value)) {
      throw new BadRequestException('startSource must be manual, schedule or nfc');
    }
  }

  private validateEndSource(value: RitualSessionEndSource): void {
    if (!['timer', 'manual', 'nfc', 'schedule'].includes(value)) {
      throw new BadRequestException('endSource must be timer, manual, nfc or schedule');
    }
  }

  private parseOptionalDate(value: string | null | undefined, fieldName: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO date`);
    }

    return date;
  }
}
