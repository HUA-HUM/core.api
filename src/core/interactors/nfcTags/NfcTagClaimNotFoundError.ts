export class NfcTagClaimNotFoundError extends Error {
  constructor() {
    super('NFC tag claim not found');
    this.name = 'NfcTagClaimNotFoundError';
  }
}
