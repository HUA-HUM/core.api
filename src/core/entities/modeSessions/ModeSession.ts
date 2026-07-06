export type ModeSessionStatus = 'active' | 'completed' | 'cancelled';
export type ModeSessionStartSource = 'manual' | 'nfc';
export type ModeSessionEndSource = 'manual' | 'nfc' | 'emergency';

export interface ModeSession {
  id: string;
  userId: string;
  modeId: string;
  startedAt: Date;
  endedAt: Date | null;
  status: ModeSessionStatus;
  startSource: ModeSessionStartSource;
  endSource: ModeSessionEndSource | null;
  durationSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StartModeSessionData {
  userId: string;
  modeId: string;
  startSource: ModeSessionStartSource;
}

export interface FinishModeSessionData {
  id: string;
  userId: string;
  status: Exclude<ModeSessionStatus, 'active'>;
  endSource: ModeSessionEndSource;
}
