import {
  FinishRitualSessionData,
  RitualSession,
  StartRitualSessionData,
} from '../../../entities/ritualSessions/RitualSession';

export const RITUAL_SESSIONS_REPOSITORY = Symbol(
  'RITUAL_SESSIONS_REPOSITORY',
);

export interface IRitualSessionsRepository {
  create(data: StartRitualSessionData): Promise<RitualSession>;
  findActiveByUserId(userId: string): Promise<RitualSession | null>;
  findById(id: string): Promise<RitualSession | null>;
  findByUserId(userId: string): Promise<RitualSession[]>;
  finish(data: FinishRitualSessionData): Promise<RitualSession | null>;
}
