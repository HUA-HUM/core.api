export type RitualProtectionErrorCode =
  | 'RITUAL_PASSWORD_REQUIRED'
  | 'INVALID_RITUAL_PASSWORD';

export class RitualProtectionError extends Error {
  constructor(public readonly code: RitualProtectionErrorCode) {
    super(code);
    this.name = 'RitualProtectionError';
  }
}
