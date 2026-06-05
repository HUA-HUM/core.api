import {
  FinishRitualSessionData,
  RecordRitualSessionData,
  RitualSession,
  StartRitualSessionData,
} from '../../../entities/ritualSessions/RitualSession';
import { RitualSessionSummary } from '../../../entities/ritualSessions/RitualSessionSummary';

export const RITUAL_SESSIONS_REPOSITORY = Symbol(
  'RITUAL_SESSIONS_REPOSITORY',
);

export interface IRitualSessionsRepository {
  create(data: StartRitualSessionData): Promise<RitualSession>;
  record(data: RecordRitualSessionData): Promise<RitualSession>;
  findActiveByUserId(userId: string): Promise<RitualSession | null>;
  findById(id: string): Promise<RitualSession | null>;
  findByUserId(userId: string): Promise<RitualSession[]>;
  findByUserIdAndRitualId(userId: string, ritualId: string): Promise<RitualSession[]>;
  getSummaryByUserId(userId: string): Promise<RitualSessionSummary>;
  finish(data: FinishRitualSessionData): Promise<RitualSession | null>;
}
