import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { GetActiveModeSessionInteractor } from '../../../core/interactors/modeSessions/GetActiveModeSessionInteractor';
import { FinishModeSessionInteractor } from '../../../core/interactors/modeSessions/FinishModeSessionInteractor';
import { FocusSessionAlreadyActiveError } from '../../../core/interactors/focusSessions/FocusSessionAlreadyActiveError';
import { GetRitualSessionInteractor } from '../../../core/interactors/ritualSessions/GetRitualSessionInteractor';
import { NfcTagsService } from '../nfcTags/NfcTagsService';
import { ApiErrorCode, apiError } from '../../errors/ApiErrorResponse';
import { IdempotencyService } from '../idempotency/IdempotencyService';

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
  tagIdentifier?: string;
  idempotencyKey?: string;
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
  idempotencyKey?: string;
}

@Injectable()
export class RitualSessionsService {
  constructor(
    private readonly ritualsService: RitualsService,
    private readonly nfcTagsService: NfcTagsService,
    private readonly startRitualSessionInteractor: StartRitualSessionInteractor,
    private readonly getActiveRitualSessionInteractor: GetActiveRitualSessionInteractor,
    private readonly getActiveModeSessionInteractor: GetActiveModeSessionInteractor,
    private readonly finishModeSessionInteractor: FinishModeSessionInteractor,
    private readonly getRitualSessionInteractor: GetRitualSessionInteractor,
    private readonly listUserRitualSessionsInteractor: ListUserRitualSessionsInteractor,
    private readonly listRitualSessionsByRitualInteractor: ListRitualSessionsByRitualInteractor,
    private readonly getRitualSessionSummaryInteractor: GetRitualSessionSummaryInteractor,
    private readonly finishRitualSessionInteractor: FinishRitualSessionInteractor,
    private readonly recordRitualSessionInteractor: RecordRitualSessionInteractor,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async start(data: StartRitualSessionServiceData): Promise<RitualSession> {
    this.validateRequiredText(data.userId, 'userId');
    this.validateRequiredText(data.ritualId, 'ritualId');
    this.validateStartSource(data.startSource);

    const ritual = await this.ritualsService.getById(
      data.userId,
      data.ritualId,
    );
    this.validateRitualCanStart(ritual);

    if (data.startSource === 'manual' || data.startSource === 'nfc') {
      await this.nfcTagsService.requireActiveTag(data.userId);
    }

    const plannedEndAt = this.parseOptionalDate(
      data.plannedEndAt,
      'plannedEndAt',
    );

    if (plannedEndAt && plannedEndAt.getTime() <= Date.now()) {
      throw new BadRequestException('plannedEndAt must be in the future');
    }

    const activeSession = await this.getActiveRitualSessionInteractor.execute(
      data.userId,
    );

    if (activeSession) {
      if (activeSession.ritualId === data.ritualId) {
        return activeSession;
      }

      throw this.activeFocusSessionConflict();
    }

    const activeModeSession = await this.getActiveModeSessionInteractor.execute(
      data.userId,
    );

    if (activeModeSession) {
      if (data.startSource !== 'schedule') {
        throw this.activeFocusSessionConflict();
      }
      await this.finishModePreemptedBySchedule(
        data.userId,
        activeModeSession.id,
      );
    }

    try {
      return await this.startRitualSessionInteractor.execute({
        userId: data.userId,
        ritualId: data.ritualId,
        plannedEndAt,
        startSource: data.startSource,
      });
    } catch (error) {
      const concurrentSession =
        await this.getActiveRitualSessionInteractor.execute(data.userId);

      if (concurrentSession?.ritualId === data.ritualId) {
        return concurrentSession;
      }

      if (concurrentSession) {
        throw this.activeFocusSessionConflict();
      }

      const concurrentModeSession =
        await this.getActiveModeSessionInteractor.execute(data.userId);

      if (concurrentModeSession) {
        if (data.startSource === 'schedule') {
          await this.finishModePreemptedBySchedule(
            data.userId,
            concurrentModeSession.id,
          );
          try {
            return await this.startRitualSessionInteractor.execute({
              userId: data.userId,
              ritualId: data.ritualId,
              plannedEndAt,
              startSource: data.startSource,
            });
          } catch (retryError) {
            if (retryError instanceof FocusSessionAlreadyActiveError) {
              throw this.activeFocusSessionConflict();
            }
            throw retryError;
          }
        }
        throw this.activeFocusSessionConflict();
      }

      if (error instanceof FocusSessionAlreadyActiveError) {
        throw this.activeFocusSessionConflict();
      }

      throw error;
    }
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
    const plannedEndAt = this.parseOptionalDate(
      data.plannedEndAt,
      'plannedEndAt',
    );
    let endedAt =
      this.parseOptionalDate(data.endedAt, 'endedAt') ??
      plannedEndAt ??
      startedAt;

    if (plannedEndAt && endedAt.getTime() > plannedEndAt.getTime()) {
      endedAt = plannedEndAt;
    }

    if (endedAt.getTime() < startedAt.getTime()) {
      throw new BadRequestException(
        'endedAt must be greater than or equal to startedAt',
      );
    }

    if (
      data.startSource === 'schedule' &&
      data.endSource === 'schedule' &&
      plannedEndAt &&
      endedAt.getTime() < plannedEndAt.getTime() - 60_000
    ) {
      throw new BadRequestException(
        'scheduled session cannot end before planned end',
      );
    }

    if (data.startSource === 'schedule' && data.endSource === 'schedule') {
      const activeModeSession =
        await this.getActiveModeSessionInteractor.execute(data.userId);
      if (activeModeSession) {
        await this.finishModePreemptedBySchedule(
          data.userId,
          activeModeSession.id,
        );
      }
    }

    return this.idempotencyService.execute({
      userId: data.userId,
      key: data.idempotencyKey,
      operation: 'record_scheduled_ritual_session',
      request: {
        ritualId: data.ritualId,
        startedAt,
        plannedEndAt,
        endedAt,
        status: data.status,
        startSource: data.startSource,
        endSource: data.endSource,
      },
      resourceType: 'ritual_session',
      execute: () =>
        this.recordRitualSessionInteractor.execute({
          userId: data.userId,
          ritualId: data.ritualId,
          startedAt,
          plannedEndAt,
          endedAt,
          status: data.status,
          startSource: data.startSource,
          endSource: data.endSource,
        }),
      replay: (resourceId) => this.replaySession(data.userId, resourceId),
      resourceId: (session) => session.id,
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

    return this.idempotencyService.execute({
      userId: data.userId,
      key: data.idempotencyKey,
      operation: 'finish_ritual_session',
      request: {
        sessionId: data.sessionId,
        status,
        endSource: data.endSource,
      },
      resourceType: 'ritual_session',
      execute: () => this.finishOnce(data, status),
      replay: (resourceId) => this.replaySession(data.userId, resourceId),
      resourceId: (session) => session.id,
    });
  }

  private async finishOnce(
    data: FinishRitualSessionServiceData,
    status: Exclude<RitualSessionStatus, 'active'>,
  ): Promise<RitualSession> {
    const activeSession = await this.getRitualSessionInteractor.execute(
      data.sessionId,
    );

    if (
      !activeSession ||
      activeSession.userId !== data.userId ||
      activeSession.status !== 'active'
    ) {
      throw new NotFoundException('active ritual session not found');
    }

    const ritual = await this.ritualsService.getById(
      data.userId,
      activeSession.ritualId,
    );

    if (data.endSource === 'nfc') {
      await this.nfcTagsService.verifyRequiredTag({
        userId: data.userId,
        tagIdentifier: data.tagIdentifier ?? '',
      });
    } else if (data.endSource === 'manual' && ritual.isProtected) {
      throw new ForbiddenException(
        apiError(
          ApiErrorCode.nfcRequiredToFinish,
          'protected ritual requires nfc to finish',
        ),
      );
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

  private async replaySession(
    userId: string,
    resourceId: string,
  ): Promise<RitualSession> {
    const session = await this.getRitualSessionInteractor.execute(resourceId);
    if (!session || session.userId !== userId) {
      throw new ConflictException(
        apiError(
          ApiErrorCode.idempotencyKeyReused,
          'idempotency result is no longer available',
        ),
      );
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
      throw new BadRequestException(
        'startSource must be manual, schedule or nfc',
      );
    }
  }

  private validateRitualCanStart(ritual: {
    status: string;
    appCount: number;
    categoryCount: number;
    domainCount: number;
  }): void {
    if (ritual.status !== 'active') {
      throw new ConflictException(
        apiError(ApiErrorCode.ritualNotActive, 'ritual is not active'),
      );
    }

    if (ritual.appCount + ritual.categoryCount + ritual.domainCount <= 0) {
      throw new ConflictException(
        apiError(
          ApiErrorCode.ritualBlockedItemsRequired,
          'ritual has no blocked items',
        ),
      );
    }
  }

  private activeFocusSessionConflict(): ConflictException {
    return new ConflictException(
      apiError(
        ApiErrorCode.activeFocusSessionExists,
        'user already has an active focus session',
      ),
    );
  }

  private async finishModePreemptedBySchedule(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    await this.finishModeSessionInteractor.execute({
      id: sessionId,
      userId,
      status: 'cancelled',
      endSource: 'schedule',
    });
  }

  private validateEndSource(value: RitualSessionEndSource): void {
    if (!['timer', 'manual', 'nfc', 'schedule'].includes(value)) {
      throw new BadRequestException(
        'endSource must be timer, manual, nfc or schedule',
      );
    }
  }

  private parseRequiredDate(value: string, fieldName: string): Date {
    const date = this.parseOptionalDate(value, fieldName);
    if (!date) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return date;
  }

  private parseOptionalDate(
    value: string | null | undefined,
    fieldName: string,
  ): Date | null {
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
