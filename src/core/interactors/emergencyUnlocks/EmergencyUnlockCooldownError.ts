export class EmergencyUnlockCooldownError extends Error {
  constructor(readonly nextAvailableAt: Date) {
    super('Emergency unlock is still on cooldown');
    this.name = 'EmergencyUnlockCooldownError';
  }
}
