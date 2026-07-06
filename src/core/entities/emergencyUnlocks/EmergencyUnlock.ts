export type EmergencyUnlockReason = 'forgot_tag' | 'lost_tag';
export type EmergencyUnlockSessionType = 'ritual' | 'mode';

export interface EmergencyUnlockStatus {
  available: boolean;
  cooldownDays: number;
  lastUsedAt: Date | null;
  nextAvailableAt: Date | null;
}

export interface EmergencyUnlock {
  id: string;
  userId: string;
  sessionType: EmergencyUnlockSessionType;
  sessionId: string;
  reason: EmergencyUnlockReason;
  tagMarkedLost: boolean;
  usedAt: Date;
  nextAvailableAt: Date;
}

export interface UseEmergencyUnlockData {
  userId: string;
  reason: EmergencyUnlockReason;
}
