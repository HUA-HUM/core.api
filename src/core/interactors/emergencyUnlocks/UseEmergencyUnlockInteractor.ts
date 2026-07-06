import { IEmergencyUnlocksRepository } from '../../adapters/repositories/emergencyUnlocks/IEmergencyUnlocksRepository';
import { UseEmergencyUnlockData } from '../../entities/emergencyUnlocks/EmergencyUnlock';
import { GetEmergencyUnlockStatusInteractor } from './GetEmergencyUnlockStatusInteractor';

export class UseEmergencyUnlockInteractor {
  constructor(private readonly repository: IEmergencyUnlocksRepository) {}

  execute(data: UseEmergencyUnlockData) {
    return this.repository.use(
      data,
      GetEmergencyUnlockStatusInteractor.cooldownDays,
    );
  }
}
