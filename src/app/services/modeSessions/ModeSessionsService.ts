import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModesService } from '../modes/ModesService';
import { FinishModeSessionInteractor } from '../../../core/interactors/modeSessions/FinishModeSessionInteractor';
import { GetActiveModeSessionInteractor } from '../../../core/interactors/modeSessions/GetActiveModeSessionInteractor';
import { GetModeSessionSummaryInteractor } from '../../../core/interactors/modeSessions/GetModeSessionSummaryInteractor';
import { ListModeSessionsByModeInteractor } from '../../../core/interactors/modeSessions/ListModeSessionsByModeInteractor';
import { ListUserModeSessionsInteractor } from '../../../core/interactors/modeSessions/ListUserModeSessionsInteractor';
import { StartModeSessionInteractor } from '../../../core/interactors/modeSessions/StartModeSessionInteractor';
import { GetActiveRitualSessionInteractor } from '../../../core/interactors/ritualSessions/GetActiveRitualSessionInteractor';
import { FocusSessionAlreadyActiveError } from '../../../core/interactors/focusSessions/FocusSessionAlreadyActiveError';
import { GetModeSessionInteractor } from '../../../core/interactors/modeSessions/GetModeSessionInteractor';
import { NfcTagsService } from '../nfcTags/NfcTagsService';
import { ApiErrorCode, apiError } from '../../errors/ApiErrorResponse';
import {
  ModeSession,
  ModeSessionEndSource,
  ModeSessionStartSource,
  ModeSessionStatus,
} from '../../../core/entities/modeSessions/ModeSession';
import { ModeSessionSummary } from '../../../core/entities/modeSessions/ModeSessionSummary';
import { IdempotencyService } from '../idempotency/IdempotencyService';

export interface StartModeSessionServiceData {
  userId: string;
  modeId: string;
  startSource: ModeSessionStartSource;
}

export interface FinishModeSessionServiceData {
  userId: string;
  sessionId: string;
  status?: Exclude<ModeSessionStatus, 'active'>;
  endSource: ModeSessionEndSource;
  tagIdentifier?: string;
  idempotencyKey?: string;
}

@Injectable()
export class ModeSessionsService {
  constructor(
    private readonly modesService: ModesService,
    private readonly nfcTagsService: NfcTagsService,
    private readonly startModeSessionInteractor: StartModeSessionInteractor,
    private readonly getActiveModeSessionInteractor: GetActiveModeSessionInteractor,
    private readonly getActiveRitualSessionInteractor: GetActiveRitualSessionInteractor,
    private readonly getModeSessionInteractor: GetModeSessionInteractor,
    private readonly listUserModeSessionsInteractor: ListUserModeSessionsInteractor,
    private readonly listModeSessionsByModeInteractor: ListModeSessionsByModeInteractor,
    private readonly getModeSessionSummaryInteractor: GetModeSessionSummaryInteractor,
    private readonly finishModeSessionInteractor: FinishModeSessionInteractor,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async start(data: StartModeSessionServiceData): Promise<ModeSession> {
    this.validateRequiredText(data.userId, 'userId');
    this.validateRequiredText(data.modeId, 'modeId');
    this.validateStartSource(data.startSource);

    const mode = await this.modesService.getById(data.userId, data.modeId);
    this.validateModeCanStart(mode);
    await this.nfcTagsService.requireActiveTag(data.userId);

    const activeSession = await this.getActiveModeSessionInteractor.execute(
      data.userId,
    );

    if (activeSession) {
      if (activeSession.modeId === data.modeId) {
        return activeSession;
      }

      throw this.activeFocusSessionConflict();
    }

    const activeRitualSession =
      await this.getActiveRitualSessionInteractor.execute(data.userId);

    if (activeRitualSession) {
      throw this.activeFocusSessionConflict();
    }

    try {
      return await this.startModeSessionInteractor.execute({
        userId: data.userId,
        modeId: data.modeId,
        startSource: data.startSource,
      });
    } catch (error) {
      const concurrentSession =
        await this.getActiveModeSessionInteractor.execute(data.userId);

      if (concurrentSession?.modeId === data.modeId) {
        return concurrentSession;
      }

      if (concurrentSession) {
        throw this.activeFocusSessionConflict();
      }

      const concurrentRitualSession =
        await this.getActiveRitualSessionInteractor.execute(data.userId);

      if (concurrentRitualSession) {
        throw this.activeFocusSessionConflict();
      }

      if (error instanceof FocusSessionAlreadyActiveError) {
        throw this.activeFocusSessionConflict();
      }

      throw error;
    }
  }

  async getActive(userId: string): Promise<ModeSession | null> {
    this.validateRequiredText(userId, 'userId');
    return this.getActiveModeSessionInteractor.execute(userId);
  }

  async list(userId: string): Promise<ModeSession[]> {
    this.validateRequiredText(userId, 'userId');
    return this.listUserModeSessionsInteractor.execute(userId);
  }

  async summary(userId: string): Promise<ModeSessionSummary> {
    this.validateRequiredText(userId, 'userId');
    return this.getModeSessionSummaryInteractor.execute(userId);
  }

  async listByModeId(userId: string, modeId: string): Promise<ModeSession[]> {
    this.validateRequiredText(userId, 'userId');
    this.validateRequiredText(modeId, 'modeId');
    await this.modesService.getById(userId, modeId);
    return this.listModeSessionsByModeInteractor.execute(userId, modeId);
  }

  async finish(data: FinishModeSessionServiceData): Promise<ModeSession> {
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
      operation: 'finish_mode_session',
      request: {
        sessionId: data.sessionId,
        status,
        endSource: data.endSource,
      },
      resourceType: 'mode_session',
      execute: () => this.finishOnce(data, status),
      replay: (resourceId) =>
        this.replayFinishedSession(data.userId, resourceId),
      resourceId: (session) => session.id,
    });
  }

  private async finishOnce(
    data: FinishModeSessionServiceData,
    status: Exclude<ModeSessionStatus, 'active'>,
  ): Promise<ModeSession> {
    const activeSession = await this.getModeSessionInteractor.execute(
      data.sessionId,
    );

    if (
      !activeSession ||
      activeSession.userId !== data.userId ||
      activeSession.status !== 'active'
    ) {
      throw new NotFoundException('active mode session not found');
    }

    const mode = await this.modesService.getById(
      data.userId,
      activeSession.modeId,
    );

    if (data.endSource === 'nfc') {
      await this.nfcTagsService.verifyRequiredTag({
        userId: data.userId,
        tagIdentifier: data.tagIdentifier ?? '',
      });
    } else if (mode.isProtected) {
      throw new ForbiddenException(
        apiError(
          ApiErrorCode.nfcRequiredToFinish,
          'protected mode requires nfc to finish',
        ),
      );
    }

    const session = await this.finishModeSessionInteractor.execute({
      id: data.sessionId,
      userId: data.userId,
      status,
      endSource: data.endSource,
    });

    if (!session) {
      throw new NotFoundException('active mode session not found');
    }

    return session;
  }

  private async replayFinishedSession(
    userId: string,
    resourceId: string,
  ): Promise<ModeSession> {
    const session = await this.getModeSessionInteractor.execute(resourceId);
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

  private validateStartSource(value: ModeSessionStartSource): void {
    if (!['manual', 'nfc'].includes(value)) {
      throw new BadRequestException('startSource must be manual or nfc');
    }
  }

  private validateModeCanStart(mode: {
    status: string;
    appCount: number;
    categoryCount: number;
    domainCount: number;
  }): void {
    if (mode.status !== 'active') {
      throw new ConflictException(
        apiError(ApiErrorCode.modeNotActive, 'mode is not active'),
      );
    }

    if (mode.appCount + mode.categoryCount + mode.domainCount <= 0) {
      throw new ConflictException(
        apiError(
          ApiErrorCode.modeBlockedItemsRequired,
          'mode has no blocked items',
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

  private validateEndSource(value: ModeSessionEndSource): void {
    if (!['manual', 'nfc'].includes(value)) {
      throw new BadRequestException('endSource must be manual or nfc');
    }
  }
}
