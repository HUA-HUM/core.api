export class NfcTagLostError extends Error {
  constructor() {
    super('NFC tag was marked as lost');
    this.name = 'NfcTagLostError';
  }
}
