export type RitualSessionStatus = 'active' | 'completed' | 'cancelled';
export type RitualSessionStartSource = 'manual' | 'schedule' | 'nfc';
export type RitualSessionEndSource = 'timer' | 'manual' | 'nfc' | 'schedule';

export interface RitualSession {
  id: string;
  userId: string;
  ritualId: string;
  startedAt: Date;
  plannedEndAt: Date | null;
  endedAt: Date | null;
  status: RitualSessionStatus;
  startSource: RitualSessionStartSource;
  endSource: RitualSessionEndSource | null;
  durationSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StartRitualSessionData {
  userId: string;
  ritualId: string;
  plannedEndAt?: Date | null;
  startSource: RitualSessionStartSource;
}

export interface FinishRitualSessionData {
  id: string;
  userId: string;
  status: Exclude<RitualSessionStatus, 'active'>;
  endSource: RitualSessionEndSource;
}

export interface RecordRitualSessionData {
  userId: string;
  ritualId: string;
  startedAt: Date;
  plannedEndAt?: Date | null;
  endedAt?: Date | null;
  status: Exclude<RitualSessionStatus, 'active'>;
  startSource: RitualSessionStartSource;
  endSource: RitualSessionEndSource;
}
