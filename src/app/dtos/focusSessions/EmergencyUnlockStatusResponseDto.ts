import { EmergencyUnlockStatus } from '../../../core/entities/emergencyUnlocks/EmergencyUnlock';

export class EmergencyUnlockStatusResponseDto {
  available!: boolean;
  cooldownDays!: number;
  lastUsedAt!: string | null;
  nextAvailableAt!: string | null;

  static fromEntity(
    status: EmergencyUnlockStatus,
  ): EmergencyUnlockStatusResponseDto {
    return {
      available: status.available,
      cooldownDays: status.cooldownDays,
      lastUsedAt: status.lastUsedAt?.toISOString() ?? null,
      nextAvailableAt: status.nextAvailableAt?.toISOString() ?? null,
    };
  }
}
