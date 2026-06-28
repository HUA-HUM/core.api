import {
  FinishModeSessionData,
  ModeSession,
  StartModeSessionData,
} from '../../../entities/modeSessions/ModeSession';
import { ModeSessionSummary } from '../../../entities/modeSessions/ModeSessionSummary';

export const MODE_SESSIONS_REPOSITORY = Symbol('MODE_SESSIONS_REPOSITORY');

export interface IModeSessionsRepository {
  create(data: StartModeSessionData): Promise<ModeSession>;
  findActiveByUserId(userId: string): Promise<ModeSession | null>;
  findById(id: string): Promise<ModeSession | null>;
  findByUserId(userId: string): Promise<ModeSession[]>;
  findByUserIdAndModeId(userId: string, modeId: string): Promise<ModeSession[]>;
  getSummaryByUserId(userId: string): Promise<ModeSessionSummary>;
  finish(data: FinishModeSessionData): Promise<ModeSession | null>;
}
