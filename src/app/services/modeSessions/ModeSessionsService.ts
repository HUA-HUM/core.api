import {
  BadRequestException,
  ConflictException,
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
import {
  ModeSession,
  ModeSessionEndSource,
  ModeSessionStartSource,
  ModeSessionStatus,
} from '../../../core/entities/modeSessions/ModeSession';
import { ModeSessionSummary } from '../../../core/entities/modeSessions/ModeSessionSummary';

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
}

@Injectable()
export class ModeSessionsService {
  constructor(
    private readonly modesService: ModesService,
    private readonly startModeSessionInteractor: StartModeSessionInteractor,
    private readonly getActiveModeSessionInteractor: GetActiveModeSessionInteractor,
    private readonly getActiveRitualSessionInteractor: GetActiveRitualSessionInteractor,
    private readonly listUserModeSessionsInteractor: ListUserModeSessionsInteractor,
    private readonly listModeSessionsByModeInteractor: ListModeSessionsByModeInteractor,
    private readonly getModeSessionSummaryInteractor: GetModeSessionSummaryInteractor,
    private readonly finishModeSessionInteractor: FinishModeSessionInteractor,
  ) {}

  async start(data: StartModeSessionServiceData): Promise<ModeSession> {
    this.validateRequiredText(data.userId, 'userId');
    this.validateRequiredText(data.modeId, 'modeId');
    this.validateStartSource(data.startSource);

    await this.modesService.getById(data.userId, data.modeId);

    const activeSession = await this.getActiveModeSessionInteractor.execute(
      data.userId,
    );

    if (activeSession) {
      if (activeSession.modeId === data.modeId) {
        return activeSession;
      }

      throw new ConflictException('user already has an active mode session');
    }

    const activeRitualSession =
      await this.getActiveRitualSessionInteractor.execute(data.userId);

    if (activeRitualSession) {
      throw new ConflictException('user already has an active focus session');
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
        throw new ConflictException('user already has an active mode session');
      }

      const concurrentRitualSession =
        await this.getActiveRitualSessionInteractor.execute(data.userId);

      if (concurrentRitualSession) {
        throw new ConflictException('user already has an active focus session');
      }

      if (error instanceof FocusSessionAlreadyActiveError) {
        throw new ConflictException('user already has an active focus session');
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

  private validateEndSource(value: ModeSessionEndSource): void {
    if (!['manual', 'nfc'].includes(value)) {
      throw new BadRequestException('endSource must be manual or nfc');
    }
  }
}
