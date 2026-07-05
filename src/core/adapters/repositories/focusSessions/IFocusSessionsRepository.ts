import { ActiveFocusSession } from '../../../entities/focusSessions/ActiveFocusSession';

export const FOCUS_SESSIONS_REPOSITORY = Symbol('FOCUS_SESSIONS_REPOSITORY');

export interface IFocusSessionsRepository {
  findActiveByUserId(userId: string): Promise<ActiveFocusSession | null>;
}
