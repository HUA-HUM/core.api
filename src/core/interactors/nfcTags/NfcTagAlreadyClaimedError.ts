export class NfcTagAlreadyClaimedError extends Error {
  constructor() {
    super('NFC tag is already claimed by another user');
    this.name = 'NfcTagAlreadyClaimedError';
  }
}
