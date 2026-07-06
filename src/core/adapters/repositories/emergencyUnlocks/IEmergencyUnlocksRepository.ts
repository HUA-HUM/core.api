import {
  EmergencyUnlock,
  EmergencyUnlockStatus,
  UseEmergencyUnlockData,
} from '../../../entities/emergencyUnlocks/EmergencyUnlock';

export const EMERGENCY_UNLOCKS_REPOSITORY = Symbol(
  'EMERGENCY_UNLOCKS_REPOSITORY',
);

export interface IEmergencyUnlocksRepository {
  getStatus(
    userId: string,
    cooldownDays: number,
  ): Promise<EmergencyUnlockStatus>;
  use(
    data: UseEmergencyUnlockData,
    cooldownDays: number,
  ): Promise<EmergencyUnlock>;
}
