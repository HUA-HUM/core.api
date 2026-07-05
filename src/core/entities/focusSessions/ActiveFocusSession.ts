export type ActiveFocusSessionType = 'ritual' | 'mode';

export interface ActiveFocusSession {
  type: ActiveFocusSessionType;
  id: string;
  userId: string;
  ritualId: string | null;
  modeId: string | null;
  startedAt: Date;
  plannedEndAt: Date | null;
  endedAt: Date | null;
  status: 'active';
  startSource: string;
  endSource: string | null;
  durationSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}
