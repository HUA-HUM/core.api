import { EmergencyUnlock } from '../../../core/entities/emergencyUnlocks/EmergencyUnlock';

export class EmergencyUnlockResponseDto {
  id!: string;
  sessionType!: 'ritual' | 'mode';
  sessionId!: string;
  reason!: 'forgot_tag' | 'lost_tag';
  tagMarkedLost!: boolean;
  usedAt!: string;
  nextAvailableAt!: string;

  static fromEntity(unlock: EmergencyUnlock): EmergencyUnlockResponseDto {
    return {
      id: unlock.id,
      sessionType: unlock.sessionType,
      sessionId: unlock.sessionId,
      reason: unlock.reason,
      tagMarkedLost: unlock.tagMarkedLost,
      usedAt: unlock.usedAt.toISOString(),
      nextAvailableAt: unlock.nextAvailableAt.toISOString(),
    };
  }
}
