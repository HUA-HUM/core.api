import { IEmergencyUnlocksRepository } from '../../adapters/repositories/emergencyUnlocks/IEmergencyUnlocksRepository';

export class GetEmergencyUnlockStatusInteractor {
  static readonly cooldownDays = 30;

  constructor(private readonly repository: IEmergencyUnlocksRepository) {}

  execute(userId: string) {
    return this.repository.getStatus(
      userId,
      GetEmergencyUnlockStatusInteractor.cooldownDays,
    );
  }
}
