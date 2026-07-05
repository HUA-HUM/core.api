export const ApiErrorCode = {
  activeFocusSessionExists: 'ACTIVE_FOCUS_SESSION_EXISTS',
  idempotencyKeyReused: 'IDEMPOTENCY_KEY_REUSED',
  invalidNfcTag: 'INVALID_NFC_TAG',
  modeBlockedItemsRequired: 'MODE_BLOCKED_ITEMS_REQUIRED',
  modeNotActive: 'MODE_NOT_ACTIVE',
  nfcRequiredToFinish: 'NFC_REQUIRED_TO_FINISH',
  nfcTagInUse: 'NFC_TAG_IN_USE',
  nfcTagAlreadyClaimed: 'NFC_TAG_ALREADY_CLAIMED',
  nfcTagRequired: 'NFC_TAG_REQUIRED',
  ritualBlockedItemsRequired: 'RITUAL_BLOCKED_ITEMS_REQUIRED',
  ritualNotActive: 'RITUAL_NOT_ACTIVE',
} as const;

export function apiError(code: string, message: string) {
  return { code, message };
}
