import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RitualsService } from '../rituals/RitualsService';
import { GetActiveRitualSessionInteractor } from '../../../core/interactors/ritualSessions/GetActiveRitualSessionInteractor';
import { GetRitualSessionSummaryInteractor } from '../../../core/interactors/ritualSessions/GetRitualSessionSummaryInteractor';
import { FinishRitualSessionInteractor } from '../../../core/interactors/ritualSessions/FinishRitualSessionInteractor';
import { ListRitualSessionsByRitualInteractor } from '../../../core/interactors/ritualSessions/ListRitualSessionsByRitualInteractor';
import { ListUserRitualSessionsInteractor } from '../../../core/interactors/ritualSessions/ListUserRitualSessionsInteractor';
import { RecordRitualSessionInteractor } from '../../../core/interactors/ritualSessions/RecordRitualSessionInteractor';
import { StartRitualSessionInteractor } from '../../../core/interactors/ritualSessions/StartRitualSessionInteractor';
import {
  RitualSession,
  RitualSessionEndSource,
  RitualSessionStartSource,
  RitualSessionStatus,
} from '../../../core/entities/ritualSessions/RitualSession';
import { RitualSessionSummary } from '../../../core/entities/ritualSessions/RitualSessionSummary';

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

export interface RecordRitualSessionServiceData {
  userId: string;
  ritualId: string;
  startedAt: string;
  plannedEndAt?: string | null;
  endedAt?: string | null;
  status: Exclude<RitualSessionStatus, 'active'>;
  startSource: RitualSessionStartSource;
  endSource: RitualSessionEndSource;
}

@Injectable()
export class RitualSessionsService {
  constructor(
    private readonly ritualsService: RitualsService,
    private readonly startRitualSessionInteractor: StartRitualSessionInteractor,
    private readonly getActiveRitualSessionInteractor: GetActiveRitualSessionInteractor,
    private readonly listUserRitualSessionsInteractor: ListUserRitualSessionsInteractor,
    private readonly listRitualSessionsByRitualInteractor: ListRitualSessionsByRitualInteractor,
    private readonly getRitualSessionSummaryInteractor: GetRitualSessionSummaryInteractor,
    private readonly finishRitualSessionInteractor: FinishRitualSessionInteractor,
    private readonly recordRitualSessionInteractor: RecordRitualSessionInteractor,
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


  async summary(userId: string): Promise<RitualSessionSummary> {
    this.validateRequiredText(userId, 'userId');
    return this.getRitualSessionSummaryInteractor.execute(userId);
  }

  async listByRitualId(
    userId: string,
    ritualId: string,
  ): Promise<RitualSession[]> {
    this.validateRequiredText(userId, 'userId');
    this.validateRequiredText(ritualId, 'ritualId');
    await this.ritualsService.getById(userId, ritualId);
    return this.listRitualSessionsByRitualInteractor.execute(userId, ritualId);
  }

  async record(data: RecordRitualSessionServiceData): Promise<RitualSession> {
    this.validateRequiredText(data.userId, 'userId');
    this.validateRequiredText(data.ritualId, 'ritualId');
    this.validateStartSource(data.startSource);
    this.validateEndSource(data.endSource);

    if (!['completed', 'cancelled'].includes(data.status)) {
      throw new BadRequestException('status must be completed or cancelled');
    }

    await this.ritualsService.getById(data.userId, data.ritualId);

    const startedAt = this.parseRequiredDate(data.startedAt, 'startedAt');
    const plannedEndAt = this.parseOptionalDate(data.plannedEndAt, 'plannedEndAt');
    const endedAt = this.parseOptionalDate(data.endedAt, 'endedAt') ?? plannedEndAt ?? startedAt;

    if (endedAt.getTime() < startedAt.getTime()) {
      throw new BadRequestException('endedAt must be greater than or equal to startedAt');
    }

    return this.recordRitualSessionInteractor.execute({
      userId: data.userId,
      ritualId: data.ritualId,
      startedAt,
      plannedEndAt,
      endedAt,
      status: data.status,
      startSource: data.startSource,
      endSource: data.endSource,
    });
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

  private parseRequiredDate(value: string, fieldName: string): Date {
    const date = this.parseOptionalDate(value, fieldName);
    if (!date) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return date;
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
