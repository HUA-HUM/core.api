export const ApiErrorCode = {
  activeFocusSessionRequired: 'ACTIVE_FOCUS_SESSION_REQUIRED',
  activeFocusSessionExists: 'ACTIVE_FOCUS_SESSION_EXISTS',
  emergencyUnlockCooldown: 'EMERGENCY_UNLOCK_COOLDOWN',
  idempotencyKeyReused: 'IDEMPOTENCY_KEY_REUSED',
  invalidNfcTag: 'INVALID_NFC_TAG',
  modeBlockedItemsRequired: 'MODE_BLOCKED_ITEMS_REQUIRED',
  modeNotActive: 'MODE_NOT_ACTIVE',
  nfcRequiredToFinish: 'NFC_REQUIRED_TO_FINISH',
  nfcTagInUse: 'NFC_TAG_IN_USE',
  nfcTagAlreadyClaimed: 'NFC_TAG_ALREADY_CLAIMED',
  nfcTagLost: 'NFC_TAG_LOST',
  nfcTagRequired: 'NFC_TAG_REQUIRED',
  ritualBlockedItemsRequired: 'RITUAL_BLOCKED_ITEMS_REQUIRED',
  ritualNotActive: 'RITUAL_NOT_ACTIVE',
  ritualSessionActive: 'RITUAL_SESSION_ACTIVE',
} as const;

export function apiError(code: string, message: string) {
  return { code, message };
}
